import { createServerClient } from "./supabase/server";

export async function getSessionAndProfile() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { user: null, profile: null };

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      return { user, profile: null };
    }

    return { user, profile };
  } catch (error) {
    console.error("Error fetching session and profile:", error);
    return { user: null, profile: null };
  }
}
