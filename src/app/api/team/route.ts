import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifySession, requireRole } from "@/lib/firebase/auth-helpers";
import { FieldValue } from "firebase-admin/firestore";
import { logAction } from "@/lib/audit-log";
import { sanitize } from "@/lib/sanitize";
import { cached, invalidate } from "@/lib/cache";

/** GET — List all team members (public, cached 60s) */
export async function GET(request: NextRequest) {
  const showAll = request.nextUrl.searchParams.get("all") === "1";

  try {
    // ?all=1 requires editor+ auth — prevents public users from seeing hidden members
    if (showAll) {
      const session = await verifySession(request);
      requireRole(session.role, "editor");
    }

    const cacheKey = showAll ? "team_all" : "team";
    const team = await cached(cacheKey, async () => {
      const snap = await adminDb
        .collection("team")
        .orderBy("order", "asc")
        .get();
      const docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      // Public endpoint: only return visible members
      if (!showAll) return docs.filter((m: Record<string, unknown>) => m.visible !== false);
      return docs;
    });
    // Public requests get CDN-cached; admin (?all=1) do not
    const headers: Record<string, string> = showAll
      ? {}
      : { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" };
    return NextResponse.json(team, { headers });
  } catch (error: unknown) {
    // Auth failures for ?all=1 should return 403, not empty array
    if (showAll) {
      const msg = error instanceof Error ? error.message : "Server error";
      const status = msg.includes("Insufficient") ? 403 : msg.includes("authenticated") ? 401 : 500;
      return NextResponse.json({ error: msg }, { status });
    }
    return NextResponse.json([], { status: 200 });
  }
}

/** POST — Add a team member (editor+) */
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    requireRole(session.role, "editor");

    const body = await request.json();
    const name = sanitize(body.name, 200);
    const memberRole = sanitize(body.role, 200);
    const image = typeof body.image === "string" ? sanitize(body.image, 2000) : "";
    const linkedin = typeof body.linkedin === "string" ? sanitize(body.linkedin, 2000) : "";
    const batch = typeof body.batch === "string" ? sanitize(body.batch, 20) : new Date().getFullYear().toString();
    const visible = body.visible !== false; // default true
    const category = ["core_committee", "team_head", "member"].includes(body.category)
      ? body.category
      : "member";

    if (!name || !memberRole) {
      return NextResponse.json(
        { error: "Name and role are required." },
        { status: 400 }
      );
    }

    const snap = await adminDb.collection("team").get();
    const order = snap.size;

    const docRef = await adminDb.collection("team").add({
      name,
      role: memberRole,
      image: image || "",
      linkedin: linkedin || "",
      batch: batch || new Date().getFullYear().toString(),
      visible,
      category,
      order,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await logAction(session.uid, session.name, "create", `created team member "${name}"`);
    invalidate("team");
    invalidate("team_all");

    return NextResponse.json({
      id: docRef.id,
      message: "Team member added!",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    const status = msg.includes("Insufficient") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

/** PUT — Update a team member (editor+) */
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
        { error: "Missing team member ID." },
        { status: 400 }
      );
    }

    await adminDb
      .collection("team")
      .doc(id)
      .update({ ...data, updatedAt: FieldValue.serverTimestamp() });

    await logAction(session.uid, session.name, "update", `updated team member "${data.name || id}"`);
    invalidate("team");
    invalidate("team_all");

    return NextResponse.json({ message: "Team member updated!" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** DELETE — Remove a team member (admin+) */
export async function DELETE(request: NextRequest) {
  try {
    const session = await verifySession(request);
    requireRole(session.role, "admin");

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Missing team member ID." },
        { status: 400 }
      );
    }

    const doc = await adminDb.collection("team").doc(id).get();
    const memberName = doc.data()?.name || id;
    await adminDb.collection("team").doc(id).delete();
    await logAction(session.uid, session.name, "delete", `deleted team member "${memberName}"`);
    invalidate("team");
    invalidate("team_all");

    return NextResponse.json({ message: "Team member removed!" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
