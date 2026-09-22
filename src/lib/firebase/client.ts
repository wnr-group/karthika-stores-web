"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

/**
 * Browser-side Firebase.
 *
 * Only the NEXT_PUBLIC_* values live here, which is correct: Firebase web
 * config is not a secret, it is a project address. The values that *are*
 * secret (the Admin service account) never leave `firebase/admin.ts`.
 *
 * Everything is lazy and nullable on purpose. With no environment set the
 * storefront still runs end to end as a guest; only the account pages tell
 * you that sign-in is not configured yet.
 */

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId,
);

let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null;
  if (app) return app;

  app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: config.apiKey!,
        authDomain: config.authDomain!,
        projectId: config.projectId!,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId!,
      });

  return app;
}

export function getFirebaseAuth(): Auth | null {
  const instance = getFirebaseApp();
  return instance ? getAuth(instance) : null;
}

export function googleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  // Always show the chooser; silently reusing the last Google account is
  // disorienting on a shared machine.
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

/**
 * Turns Firebase's error codes into something a person can act on. The raw
 * messages ("Firebase: Error (auth/invalid-credential).") are not for
 * customers.
 */
export function authErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  switch (code) {
    case "auth/invalid-email":
      return "That email address does not look right.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "We could not match that email and password.";
    case "auth/email-already-in-use":
      return "There is already an account with this email. Try signing in instead.";
    case "auth/weak-password":
      return "Please choose a password of at least six characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "The Google window closed before sign-in finished.";
    case "auth/network-request-failed":
      return "We could not reach the network. Check your connection and try again.";
    default:
      return "Something went wrong signing you in. Please try again.";
  }
}
