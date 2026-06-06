// Client-side Supabase client factory
import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import { MockSupabaseClient } from "./mock-client";

export function createBrowserClient() {
  if (process.env.NEXT_PUBLIC_USE_MOCK_PROVIDER === "true") {
    return new MockSupabaseClient() as any;
  }
  
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
