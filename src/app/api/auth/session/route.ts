import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

const FIVE_DAYS_MS = 60 * 60 * 24 * 5 * 1000;

/**
 * POST — Exchange Firebase ID token for a server session cookie.
 * Creates Firestore user document on first login.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 20 login attempts per 15 minutes per IP
    const ip = getClientIP(request);
    const rl = checkRateLimit(`auth:${ip}`, {
      maxRequests: 20,
      windowSeconds: 900,
    });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // Verify the ID token with Firebase Admin
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    // Check if user exists in Firestore
    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();

    let role = "member";

    if (!userSnap.exists) {
      // First-time login — create the user document
      const displayName = decoded.name || decoded.email?.split("@")[0] || "User";
      await userRef.set({
        name: displayName,
        email: decoded.email || "",
        role: "member",
        active: true,
        photoURL: decoded.picture || "",
        createdAt: new Date().toISOString(),
      });
    } else {
      const userData = userSnap.data()!;
      role = userData.role || "member";

      // Super admins can never be locked out — auto-reactivate if needed
      if (role === "super_admin" && userData.active === false) {
        await userRef.update({ active: true });
      }
      // Only block non-super_admin users who are explicitly deactivated
      else if (userData.active === false) {
        return NextResponse.json(
          { error: "Your account has been deactivated. Contact an admin." },
          { status: 403 }
        );
      }

      // Ensure active field is set for older docs missing it
      if (userData.active === undefined) {
        await userRef.update({ active: true });
      }

      // Sync name, email, and photo from Firebase Auth on every login
      // This fixes users who signed up before the name-loss bug was fixed,
      // and keeps profile info current if the user changes their Google name/photo
      const updates: Record<string, string> = {};
      const authName = decoded.name;
      const authEmail = decoded.email;
      const authPhoto = decoded.picture;

      if (authName && authName !== userData.name) {
        updates.name = authName;
      }
      if (authEmail && authEmail !== userData.email) {
        updates.email = authEmail;
      }
      if (authPhoto && authPhoto !== userData.photoURL) {
        updates.photoURL = authPhoto;
      }
      if (Object.keys(updates).length > 0) {
        await userRef.update(updates);
      }
    }

    // Embed role in Firebase Auth custom claims so future verifySession()
    // calls can read it from the decoded token instead of hitting Firestore.
    // NOTE: Claims don't appear in the CURRENT ID token — only in the next
    // refresh (~1 hr) or next login. That's fine; verifySession has a
    // Firestore fallback for unclaimed sessions.
    try {
      await adminAuth.setCustomUserClaims(uid, { role });
    } catch (e) {
      console.warn("Failed to set custom claims:", e);
    }

    // Create session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: FIVE_DAYS_MS,
    });

    // Set cookies
    const cookieStore = await cookies();

    cookieStore.set("__session", sessionCookie, {
      maxAge: FIVE_DAYS_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    // Role cookie for middleware routing (NOT a security boundary)
    cookieStore.set("__role", role, {
      maxAge: FIVE_DAYS_MS / 1000,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({ role });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Authentication failed";
    console.error("Session creation error:", message);
    
    // Return descriptive error for common issues
    if (message.includes("project_id") || message.includes("FIREBASE_ADMIN")) {
      return NextResponse.json(
        { error: "Server configuration error. Check Firebase Admin environment variables." },
        { status: 500 }
      );
    }
    if (message.includes("ID token has expired") || message.includes("Firebase ID token has expired")) {
      return NextResponse.json(
        { error: "Session expired. Please sign in again." },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

/**
 * DELETE — Clear session cookies (logout).
 */
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("__session");
  cookieStore.delete("__role");
  return NextResponse.json({ success: true });
}
