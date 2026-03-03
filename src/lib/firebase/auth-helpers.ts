/**
 * Server-side helpers for verifying Firebase sessions in API routes.
 * NEVER import this file in client components.
 *
 * v2.0 — Custom-claims-first auth
 * Role is read from the session cookie's custom claims (set at login
 * and synced on role change). Firestore is ONLY read when claims are
 * missing (first login before claims propagate) or for the optional
 * `verifySessionFull()` variant. This reduces Firestore reads from
 * 1-per-API-call to ~0 for normal operations.
 */
import { adminAuth, adminDb } from "./admin";
import type { NextRequest } from "next/server";
import type { UserRole } from "@/types/firebase";
import { ROLE_HIERARCHY } from "@/lib/roles";

export interface SessionUser {
  uid: string;
  role: UserRole;
  email: string;
  name: string;
}

/**
 * Verify the session cookie and return the authenticated user's info.
 *
 * Priority:
 *   1. Custom claims on the decoded token (zero Firestore reads)
 *   2. __role cookie (set at login, NOT a security boundary but avoids
 *      a Firestore read for name/email which are non-critical)
 *   3. Firestore user doc (fallback for accounts that predate claims)
 *
 * The Firestore fallback also sets custom claims so subsequent requests
 * won't need it — self-healing migration.
 */
export async function verifySession(
  request: NextRequest
): Promise<SessionUser> {
  const session = request.cookies.get("__session")?.value;
  if (!session) throw new Error("Not authenticated");

  const decoded = await adminAuth.verifySessionCookie(session, true);

  // ── Fast path: custom claims present ────────────────────────
  const claimsRole = decoded.role as UserRole | undefined;
  if (claimsRole && ROLE_HIERARCHY[claimsRole] !== undefined) {
    return {
      uid: decoded.uid,
      role: claimsRole,
      email: decoded.email || "",
      name: decoded.name || decoded.email?.split("@")[0] || "",
    };
  }

  // ── Slow path: no claims yet → read Firestore (one-time migration) ──
  const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
  if (!userDoc.exists) throw new Error("User profile not found");

  const data = userDoc.data()!;
  if (data.active === false && data.role !== "super_admin") {
    throw new Error("Account has been deactivated");
  }

  const role = (data.role || "member") as UserRole;

  // Self-heal: set custom claims so this Firestore read never happens again
  try {
    await adminAuth.setCustomUserClaims(decoded.uid, { role });
  } catch {
    // Non-fatal — claims will be set on next login
  }

  return {
    uid: decoded.uid,
    role,
    email: data.email || decoded.email || "",
    name: data.name || "",
  };
}

/**
 * Full Firestore-backed session verification.
 * Use this ONLY for security-critical operations (role changes,
 * user deactivation) where you need the absolute latest Firestore state.
 */
export async function verifySessionFull(
  request: NextRequest
): Promise<SessionUser> {
  const session = request.cookies.get("__session")?.value;
  if (!session) throw new Error("Not authenticated");

  const decoded = await adminAuth.verifySessionCookie(session, true);
  const userDoc = await adminDb.collection("users").doc(decoded.uid).get();

  if (!userDoc.exists) throw new Error("User profile not found");

  const data = userDoc.data()!;
  if (data.active === false && data.role !== "super_admin") {
    throw new Error("Account has been deactivated");
  }

  return {
    uid: decoded.uid,
    role: data.role as UserRole,
    email: data.email || decoded.email || "",
    name: data.name || "",
  };
}

/**
 * Throw if the user's role doesn't meet the minimum requirement.
 */
export function requireRole(userRole: UserRole, minRole: UserRole): void {
  if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[minRole]) {
    throw new Error(
      `Insufficient permissions. Requires ${minRole} or higher.`
    );
  }
}
