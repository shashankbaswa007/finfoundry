import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifySession, requireRole } from "@/lib/firebase/auth-helpers";
import { FieldValue } from "firebase-admin/firestore";
import { logAction } from "@/lib/audit-log";
import { cached, invalidate } from "@/lib/cache";

const ABOUT_DOC = "content";

/** GET — Public: returns about page content (cached 60s) */
export async function GET() {
  try {
    const data = await cached("about", async () => {
      const doc = await adminDb.collection("about").doc(ABOUT_DOC).get();
      if (!doc.exists) return {};
      return { id: doc.id, ...doc.data() };
    });
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** PUT — Editor+: update about page content */
export async function PUT(request: NextRequest) {
  try {
    const session = await verifySession(request);
    requireRole(session.role, "editor");

    const body = await request.json();

    await adminDb
      .collection("about")
      .doc(ABOUT_DOC)
      .set(
        { ...body, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );

    await logAction(session.uid, session.name, "update", "updated about page content");
    invalidate("about");

    return NextResponse.json({ message: "About page updated!" });
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
