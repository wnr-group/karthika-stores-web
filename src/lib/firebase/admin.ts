import "server-only";

import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

/**
 * Server-side Firebase Admin.
 *
 * Used for exactly two things: minting the httpOnly session cookie when
 * someone signs in, and verifying that cookie on every protected request.
 * The service-account private key is read from the environment and never
 * serialised anywhere near a response.
 */

const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// Vercel and most CI systems store the key with literal \n sequences.
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

export const isAdminConfigured = Boolean(projectId && clientEmail && privateKey);

let app: App | null = null;

function getAdminApp(): App | null {
  if (!isAdminConfigured) return null;
  if (app) return app;

  app = getApps().length
    ? getApp()
    : initializeApp({
        credential: cert({
          projectId: projectId!,
          clientEmail: clientEmail!,
          privateKey: privateKey!,
        }),
      });

  return app;
}

export function getAdminAuth(): Auth | null {
  const instance = getAdminApp();
  return instance ? getAuth(instance) : null;
}

export { SESSION_COOKIE, SESSION_MAX_AGE_MS } from "@/lib/auth/constants";
