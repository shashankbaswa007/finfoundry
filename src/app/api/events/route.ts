import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifySession, requireRole } from "@/lib/firebase/auth-helpers";
import { FieldValue } from "firebase-admin/firestore";
import { logAction } from "@/lib/audit-log";
import { sanitize } from "@/lib/sanitize";
import { cached, invalidate } from "@/lib/cache";

/** GET — List all events (public, cached 60s) */
export async function GET() {
  try {
    const events = await cached("events", async () => {
      const snap = await adminDb
        .collection("events")
        .orderBy("createdAt", "desc")
        .get();
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    });
    return NextResponse.json(events, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** POST — Create a new event (editor+) */
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    requireRole(session.role, "editor");

    const body = await request.json();

    const title = sanitize(body.title, 200);
    const date = sanitize(body.date, 50);
    const type = sanitize(body.type, 50);
    const status = sanitize(body.status, 20);
    const description = sanitize(body.description, 5000);
    const imageURL = sanitize(body.imageURL || "", 500);
    const venue = sanitize(body.venue || "", 200);
    const time = sanitize(body.time || "", 50);
    const registrationLink = sanitize(body.registrationLink || "", 500);

    if (!title || !date || !type || !status || !description) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    const docRef = await adminDb.collection("events").add({
      title,
      date,
      type,
      status,
      description,
      imageURL,
      venue,
      time,
      registrationLink,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await logAction(session.uid, session.name, "create", `created event "${title}"`);
    invalidate("events");

    return NextResponse.json({ id: docRef.id, message: "Event created!" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    const status = msg.includes("permission") || msg.includes("Insufficient")
      ? 403
      : msg.includes("authenticated")
        ? 401
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

/** PUT — Update an existing event (editor+) */
export async function PUT(request: NextRequest) {
  try {
    const session = await verifySession(request);
    requireRole(session.role, "editor");

    const { id, ...rawData } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing event ID." },
        { status: 400 }
      );
    }

    // Sanitize all string fields in the update data
    const data: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(rawData)) {
      data[key] = typeof val === "string" ? sanitize(val, 5000) : val;
    }

    await adminDb
      .collection("events")
      .doc(id)
      .update({ ...data, updatedAt: FieldValue.serverTimestamp() });

    await logAction(session.uid, session.name, "update", `updated event "${data.title || id}"`);
    invalidate("events");

    return NextResponse.json({ message: "Event updated!" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** DELETE — Delete an event (admin+) */
export async function DELETE(request: NextRequest) {
  try {
    const session = await verifySession(request);
    requireRole(session.role, "admin");

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing event ID." },
        { status: 400 }
      );
    }

    const doc = await adminDb.collection("events").doc(id).get();
    const title = doc.data()?.title || id;
    await adminDb.collection("events").doc(id).delete();
    await logAction(session.uid, session.name, "delete", `deleted event "${title}"`);
    invalidate("events");

    return NextResponse.json({ message: "Event deleted!" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
