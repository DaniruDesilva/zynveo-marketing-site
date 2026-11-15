import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
        },
      })
    : null;

export interface SafeSupabaseResult<T = any> {
  data: T | null;
  error: any | null;
  isUniqueViolation?: boolean;
  isNetworkError?: boolean;
}

/**
 * Safely executes a Supabase query with timeout and network/DNS error resilience.
 * Prevents long multi-line 'TypeError: fetch failed (ENOTFOUND)' stack traces when
 * Supabase is unconfigured, paused, or offline, ensuring email delivery and API endpoints continue gracefully.
 */
export async function runSupabaseSafe<T = any>(
  queryPromise: PromiseLike<{ data: T | null; error: any | null }> | null | undefined,
  options: { timeoutMs?: number; context?: string } = {}
): Promise<SafeSupabaseResult<T>> {
  const { timeoutMs = 1800, context = "Database" } = options;

  if (!queryPromise) {
    console.warn(`[${context}] Notice: Supabase environment variables not configured; skipping database persistence.`);
    return { data: null, error: null, isNetworkError: true };
  }

  try {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Supabase query timeout after " + timeoutMs + "ms")), timeoutMs);
    });

    const result = await Promise.race([Promise.resolve(queryPromise), timeoutPromise]).finally(() => {
      clearTimeout(timer!);
    });

    const { data, error } = result || { data: null, error: null };

    if (error) {
      if (error.code === "23505") {
        return { data, error, isUniqueViolation: true };
      }

      // Check for network / DNS / fetch failures
      const errStr = JSON.stringify(error) + (error.message || "") + (error.details || "");
      if (
        errStr.includes("fetch failed") ||
        errStr.includes("ENOTFOUND") ||
        errStr.includes("ECONNREFUSED") ||
        errStr.includes("ETIMEDOUT") ||
        errStr.includes("timeout")
      ) {
        console.warn(`[${context}] Notice: Supabase unreachable (${error.message || "ENOTFOUND/fetch failed"}). Proceeding cleanly without database delay.`);
        return { data: null, error: null, isNetworkError: true };
      }

      return { data, error };
    }

    return { data, error: null };
  } catch (err: any) {
    const errStr = String(err?.message || err || "") + String(err?.details || "");
    if (
      errStr.includes("fetch failed") ||
      errStr.includes("ENOTFOUND") ||
      errStr.includes("ECONNREFUSED") ||
      errStr.includes("ETIMEDOUT") ||
      errStr.includes("timeout")
    ) {
      console.warn(`[${context}] Notice: Supabase unreachable (${err?.message || "timeout/ENOTFOUND"}). Proceeding cleanly without database delay.`);
      return { data: null, error: null, isNetworkError: true };
    }

    console.warn(`[${context}] Database query exception handled:`, err?.message || err);
    return { data: null, error: err, isNetworkError: false };
  }
}
