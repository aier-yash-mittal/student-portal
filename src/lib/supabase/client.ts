// Client-side Supabase client factory
import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import { MockSupabaseClient } from "./mock-client";
import { isMockEnabled } from "./config";

export function createBrowserClient() {
  if (isMockEnabled()) {
    return new MockSupabaseClient() as any;
  }
  
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
