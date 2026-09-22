import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The service-role Supabase client.
 *
 * This key bypasses Row Level Security, so it must never reach the browser.
 * It is only imported by server components, route handlers and server
 * actions, all of which authorise the caller themselves before querying. The
 * `server-only` import above turns a mistaken client import into a build
 * error rather than a leak.
 */

let client: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or leave both unset to run on seed data.",
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application-name": "karthika-server" } },
  });

  return client;
}
