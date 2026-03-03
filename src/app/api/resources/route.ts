import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifySession, requireRole } from "@/lib/firebase/auth-helpers";
import { FieldValue } from "firebase-admin/firestore";
import { logAction } from "@/lib/audit-log";
import { sanitize } from "@/lib/sanitize";
import { cached, invalidate } from "@/lib/cache";

/** GET — List all resource categories (public, cached 60s) */
export async function GET() {
  try {
    const resources = await cached("resources", async () => {
      const snap = await adminDb
        .collection("resources")
        .orderBy("order", "asc")
        .get();
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    });
    return NextResponse.json(resources, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

/** POST — Create a resource category (editor+) */
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    requireRole(session.role, "editor");

    const body = await request.json();
    const category = sanitize(body.category, 200);
    const items = body.items;

    if (!category || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Category name and at least one item are required." },
        { status: 400 }
      );
    }

    const snap = await adminDb.collection("resources").get();
    const order = snap.size;

    const docRef = await adminDb.collection("resources").add({
      category,
      items,
      order,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await logAction(session.uid, session.name, "create", `created resource category "${category}"`);
    invalidate("resources");

    return NextResponse.json({
      id: docRef.id,
      message: "Resource category created!",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    const status = msg.includes("Insufficient") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

/** PUT — Update a resource category (editor+) */
export async function PUT(request: NextRequest) {
  try {
    const session = await verifySession(request);
    requireRole(session.role, "editor");

    const { id, ...rawData } = await request.json();
    const data: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(rawData)) {
      data[key] = typeof val === "string" ? sanitize(val, 5000) : val;
    }

    if (!id) {
      return NextResponse.json(
        { error: "Missing resource category ID." },
        { status: 400 }
      );
    }

    await adminDb
      .collection("resources")
      .doc(id)
      .update({ ...data, updatedAt: FieldValue.serverTimestamp() });

    await logAction(session.uid, session.name, "update", `updated resource category "${data.category || id}"`);
    invalidate("resources");

    return NextResponse.json({ message: "Resource category updated!" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** DELETE — Delete a resource category (admin+) */
export async function DELETE(request: NextRequest) {
  try {
    const session = await verifySession(request);
    requireRole(session.role, "admin");

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Missing resource category ID." },
        { status: 400 }
      );
    }

    const doc = await adminDb.collection("resources").doc(id).get();
    const categoryName = doc.data()?.category || id;
    await adminDb.collection("resources").doc(id).delete();
    await logAction(session.uid, session.name, "delete", `deleted resource category "${categoryName}"`);
    invalidate("resources");

    return NextResponse.json({ message: "Resource category deleted!" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
