// Middleware cookie session refresher & route protector
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isMockEnabled } from "./config";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const path = request.nextUrl.pathname;

  // Skip static assets
  if (
    path.startsWith("/_next") ||
    path.startsWith("/favicon.ico") ||
    path.startsWith("/public") ||
    path.startsWith("/api/health") // allow healthchecks
  ) {
    return supabaseResponse;
  }

  // Handle Mock Provider Session Protection
  if (isMockEnabled()) {
    const sessionCookie = request.cookies.get("securecampus-session")?.value;
    
    // Redirect unauthenticated requests to login
    if (!sessionCookie && (path.startsWith("/dashboard") || path.startsWith("/profile") || path.startsWith("/search"))) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }
    
    // Redirect authenticated requests away from auth forms
    if (sessionCookie && (path.startsWith("/auth/login") || path.startsWith("/auth/signup"))) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    
    return supabaseResponse;
  }

  // Handle Live Supabase Session Protection
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Retrieve user to check session validity and refresh if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect logic
  if (!user && (path.startsWith("/dashboard") || path.startsWith("/profile") || path.startsWith("/search"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  if (user && (path.startsWith("/auth/login") || path.startsWith("/auth/signup"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
