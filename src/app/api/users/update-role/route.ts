import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { verifySessionFull } from "@/lib/firebase/auth-helpers";
import type { UserRole } from "@/types/firebase";
import { logAction } from "@/lib/audit-log";

const VALID_ROLES: UserRole[] = ["member", "editor", "admin", "super_admin"];

/**
 * PUT — Change a user's role.
 *
 * Rules:
 * - Only super_admin can change roles
 * - Cannot demote the last super_admin
 * - Admin can only assign member/editor (enforced in API, not just UI)
 */
export async function PUT(request: NextRequest) {
  try {
    // Use verifySessionFull for security-critical role operations
    const session = await verifySessionFull(request);

    const { uid, newRole } = await request.json();

    if (!uid || !newRole) {
      return NextResponse.json(
        { error: "User ID and new role are required." },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(newRole)) {
      return NextResponse.json(
        { error: "Invalid role specified." },
        { status: 400 }
      );
    }

    // Only admin+ can change roles
    if (session.role !== "super_admin" && session.role !== "admin") {
      return NextResponse.json(
        { error: "Only Admins and Super Admins can change user roles." },
        { status: 403 }
      );
    }

    // Admins can only assign member or editor
    if (session.role === "admin" && (newRole === "admin" || newRole === "super_admin")) {
      return NextResponse.json(
        { error: "Admins can only assign Member or Editor roles." },
        { status: 403 }
      );
    }

    // Admins cannot change the role of another admin or super_admin
    const targetSnap = await adminDb.collection("users").doc(uid).get();
    if (!targetSnap.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    const targetRole = targetSnap.data()!.role as UserRole;
    if (session.role === "admin" && (targetRole === "admin" || targetRole === "super_admin")) {
      return NextResponse.json(
        { error: "Admins cannot change the role of other Admins or Super Admins." },
        { status: 403 }
      );
    }

    // Cannot change own role
    if (uid === session.uid) {
      return NextResponse.json(
        { error: "You cannot change your own role." },
        { status: 400 }
      );
    }

    // Reuse the targetSnap already fetched above (avoid duplicate Firestore read)
    const userRef = adminDb.collection("users").doc(uid);
    const currentUserRole = targetRole;

    // If demoting a super_admin, ensure there is at least one other super_admin
    if (currentUserRole === "super_admin" && newRole !== "super_admin") {
      const superAdmins = await adminDb
        .collection("users")
        .where("role", "==", "super_admin")
        .where("active", "==", true)
        .get();

      if (superAdmins.size <= 1) {
        return NextResponse.json(
          {
            error:
              "Cannot remove the last Super Admin. Promote another user to Super Admin first.",
          },
          { status: 400 }
        );
      }
    }

    await userRef.update({ role: newRole });

    // Keep Firebase Auth custom claims in sync so verifySession()
    // returns the correct role without hitting Firestore
    try {
      await adminAuth.setCustomUserClaims(uid, { role: newRole });
    } catch (e) {
      console.warn("Failed to sync custom claims on role change:", e);
    }

    await logAction(
      session.uid,
      session.name,
      "role_change",
      `changed role of user ${uid}`,
      `${currentUserRole} → ${newRole}`
    );

    return NextResponse.json({
      message: `Role updated to ${newRole} successfully!`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    const status = msg.includes("authenticated") ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

/**
 * PATCH — Toggle user active status.
 * Only super_admin can activate/deactivate users.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await verifySessionFull(request);

    if (session.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only a Super Admin can activate/deactivate users." },
        { status: 403 }
      );
    }

    const { uid, active } = await request.json();

    if (!uid || typeof active !== "boolean") {
      return NextResponse.json(
        { error: "User ID and active status are required." },
        { status: 400 }
      );
    }

    if (uid === session.uid) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account." },
        { status: 400 }
      );
    }

    // Cannot deactivate the last super_admin
    const userSnap = await adminDb.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (
      userSnap.data()!.role === "super_admin" &&
      !active
    ) {
      const superAdmins = await adminDb
        .collection("users")
        .where("role", "==", "super_admin")
        .where("active", "==", true)
        .get();

      if (superAdmins.size <= 1) {
        return NextResponse.json(
          { error: "Cannot deactivate the last Super Admin." },
          { status: 400 }
        );
      }
    }

    await adminDb.collection("users").doc(uid).update({ active });

    // Sync active status to custom claims
    try {
      const currentRole = userSnap.data()!.role || "member";
      await adminAuth.setCustomUserClaims(uid, { role: currentRole, ...(active ? {} : { deactivated: true }) });
    } catch (e) {
      console.warn("Failed to sync custom claims on active toggle:", e);
    }

    // Revoke all refresh tokens when deactivating → forces instant logout
    // verifySessionCookie(..., true) will reject revoked tokens on next request
    if (!active) {
      try {
        await adminAuth.revokeRefreshTokens(uid);
      } catch {
        // best-effort — user might not have active tokens
      }
    }

    await logAction(
      session.uid,
      session.name,
      active ? "activate" : "deactivate",
      `${active ? "activated" : "deactivated"} user ${uid}`
    );

    return NextResponse.json({
      message: active ? "User activated!" : "User deactivated.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    const status = msg.includes("permission") || msg.includes("Insufficient")
      ? 403
      : msg.includes("authenticated") || msg.includes("deactivated")
        ? 401
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
