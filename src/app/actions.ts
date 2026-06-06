"use server";

import { headers } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import {
  loginSchema,
  signupSchema,
  profileUpdateSchema,
  type LoginInput,
  type SignupInput,
  type ProfileUpdateInput,
} from "@/lib/validations/schemas";

// Helper to get client IP address from headers safely
async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const xForwardedFor = headerList.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  return headerList.get("x-real-ip") || "127.0.0.1";
}

// 1. Secure Login Server Action
export async function loginAction(input: LoginInput) {
  const ip = await getClientIp();
  
  // Server-side Zod validation
  const validation = loginSchema.safeParse(input);
  if (!validation.success) {
    return { error: "Invalid input. Please check your credentials." };
  }

  const { email, password } = validation.data;
  const supabase = await createServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Audit log failed login
    await supabase.from("audit_logs").insert({
      actor_email: email,
      action: "LOGIN_FAILED",
      ip_address: ip,
      status: "FAILED",
      details: JSON.stringify({ error: error.message }),
    });

    return { error: error.message };
  }

  const user = data.user;
  
  // Get user profile to check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  // Audit log successful login
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    actor_email: user.email,
    action: "LOGIN_SUCCESS",
    ip_address: ip,
    status: "SUCCESS",
    details: JSON.stringify({ role: profile?.role || "student" }),
  });

  return { success: true, role: profile?.role || "student" };
}

// 2. Secure Signup Server Action
export async function signupAction(input: SignupInput) {
  const ip = await getClientIp();

  // Server-side Zod validation
  const validation = signupSchema.safeParse(input);
  if (!validation.success) {
    const errorMsg = validation.error.issues.map((e) => e.message).join(", ");
    return { error: `Validation failed: ${errorMsg}` };
  }

  const { email, password, fullName, role, department, enrollmentNo, phone } = validation.data;
  const supabase = await createServerClient();

  // Supabase Auth Signup
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
        department,
        enrollment_no: enrollmentNo,
        phone,
      },
    },
  });

  if (error) {
    await supabase.from("audit_logs").insert({
      actor_email: email,
      action: "SIGNUP_FAILED",
      ip_address: ip,
      status: "FAILED",
      details: JSON.stringify({ error: error.message }),
    });

    return { error: error.message };
  }

  const user = data.user;

  // Insert audit log
  if (user) {
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      actor_email: user.email,
      action: "SIGNUP_SUCCESS",
      ip_address: ip,
      status: "SUCCESS",
      details: JSON.stringify({ role, fullName, department }),
    });
  }

  return { success: true };
}

// 3. Secure Logout Server Action
export async function logoutAction() {
  const ip = await getClientIp();
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Insert audit log before signout removes session
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      actor_email: user.email,
      action: "LOGOUT",
      ip_address: ip,
      status: "SUCCESS",
      details: JSON.stringify({ message: "User requested logout" }),
    });
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// 4. Secure Profile Update Server Action
export async function updateProfileAction(input: ProfileUpdateInput) {
  const ip = await getClientIp();
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized. Please log in." };
  }

  // Server-side Zod validation
  const validation = profileUpdateSchema.safeParse(input);
  if (!validation.success) {
    const errorMsg = validation.error.issues.map((e) => e.message).join(", ");
    return { error: `Validation failed: ${errorMsg}` };
  }

  const { fullName, phone, department, enrollmentNo, avatarUrl } = validation.data;

  // Update in profiles table (RLS will check that user can only edit their own profile)
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone,
      department,
      enrollment_no: enrollmentNo,
      avatar_url: avatarUrl,
    })
    .eq("id", user.id);

  if (error) {
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      actor_email: user.email,
      action: "PROFILE_UPDATE_FAILED",
      ip_address: ip,
      status: "FAILED",
      details: JSON.stringify({ error: error.message }),
    });

    return { error: error.message };
  }

  // Success audit log
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    actor_email: user.email,
    action: "PROFILE_UPDATE_SUCCESS",
    ip_address: ip,
    status: "SUCCESS",
    details: JSON.stringify({ fieldsUpdated: Object.keys(validation.data) }),
  });

  return { success: true };
}

// 5. Search Logging Action (to maintain audit trails on student queries)
export async function logSearchAction(query: string, resultsCount: number) {
  const ip = await getClientIp();
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  // Get user profile to check role (only Faculty/Admin are authorized for searches)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "faculty" && profile.role !== "admin")) {
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      actor_email: user.email,
      action: "UNAUTHORIZED_SEARCH_ATTEMPT",
      ip_address: ip,
      status: "FAILED",
      details: JSON.stringify({ query }),
    });
    return { error: "Forbidden: Unauthorized access to search functionality." };
  }

  // Log successful search query
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    actor_email: user.email,
    action: "STUDENT_SEARCH",
    ip_address: ip,
    status: "SUCCESS",
    details: JSON.stringify({ query, resultsCount }),
  });

  return { success: true };
}
