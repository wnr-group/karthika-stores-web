"use client";

import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from "@/lib/firebase/client";

/**
 * Firebase authentication, plus the httpOnly session cookie the server reads.
 *
 * The client SDK holds the ID token in memory; the server never sees it
 * except once, at sign-in, when it is exchanged for a session cookie at
 * /api/auth/session. Every server-side authorisation check reads that cookie,
 * never a UID sent from the browser.
 */

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Exchanges an ID token for the server session cookie. */
async function openSession(user: User): Promise<void> {
  const idToken = await user.getIdToken();
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
}

async function closeSession(): Promise<void> {
  await fetch("/api/auth/session", { method: "DELETE" });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    return onIdTokenChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const requireAuth = useCallback(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error(
        "Sign-in is not configured yet. Add the NEXT_PUBLIC_FIREBASE_* values to .env.local.",
      );
    }
    return auth;
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const auth = requireAuth();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await openSession(credential.user);
    },
    [requireAuth],
  );

  const registerWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      const auth = requireAuth();
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(credential.user, { displayName: name });
      // Force a refresh so the session cookie carries the display name.
      await credential.user.getIdToken(true);
      await openSession(credential.user);
    },
    [requireAuth],
  );

  const signInWithGoogle = useCallback(async () => {
    const auth = requireAuth();
    const credential = await signInWithPopup(auth, googleProvider());
    await openSession(credential.user);
  }, [requireAuth]);

  const resetPassword = useCallback(
    async (email: string) => {
      const auth = requireAuth();
      await sendPasswordResetEmail(auth, email);
    },
    [requireAuth],
  );

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth) await firebaseSignOut(auth);
    await closeSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured: isFirebaseConfigured,
      signInWithEmail,
      registerWithEmail,
      signInWithGoogle,
      resetPassword,
      signOut,
    }),
    [user, loading, signInWithEmail, registerWithEmail, signInWithGoogle, resetPassword, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
