import { createClient, SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://yyvcmfjqbeixlxcjnohn.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5dmNtZmpxYmVpeGx4Y2pub2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5Njc0ODksImV4cCI6MjEwNTU0MzQ4OX0.v4rbJ9QfB5i6fSTmUaEMb6V9orJPBbJhcZpD8hdzzKA";

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseUrl =
  envUrl && envUrl.startsWith("https://") && !envUrl.includes("placeholder")
    ? envUrl
    : DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  envKey && !envKey.startsWith("sb_publishable") && envKey.length > 50
    ? envKey
    : DEFAULT_SUPABASE_ANON_KEY;

/**
 * Checks whether Supabase environment variables are configured.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("https://") &&
    !supabaseUrl.includes("placeholder")
  );
}

let supabaseInstance: SupabaseClient | null = null;

/**
 * Returns the singleton Supabase client, or null if not configured.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseInstance;
}

/**
 * Tests connection to Supabase.
 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      message: "Supabase URL or Anon Key is missing in environment variables.",
    };
  }

  try {
    const { error } = await client.from("businesses").select("id").limit(1);
    if (error) {
      return { ok: false, message: `Database error: ${error.message}` };
    }
    return { ok: true, message: "Connected to Supabase PostgreSQL successfully!" };
  } catch (err: any) {
    return { ok: false, message: err?.message || "Connection failed" };
  }
}
