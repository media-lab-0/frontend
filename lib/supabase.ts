// ⚠️ DEPRECATED ⚠️
// We now use direct SQL via lib/db.ts to avoid 443 connectivity timeouts.
// The Supabase REST client (supabase-js) is no longer used on the server.

export const supabase = {
  from: () => {
    throw new Error("Supabase REST client is DEPRECATED. Use `sql` from `@/lib/db` instead.");
  }
} as any;

export const supabaseAdmin = supabase;
