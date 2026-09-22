/**
 * Values shared between the edge middleware and the Node server.
 *
 * Kept free of imports on purpose: the middleware runs on the edge runtime,
 * and anything it pulls in gets bundled there. Importing these from
 * `firebase/admin` would drag the whole Admin SDK into the edge bundle, which
 * does not build.
 */

export const SESSION_COOKIE = "karthika_session";

/** Two weeks, the Firebase maximum for a session cookie. */
export const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
