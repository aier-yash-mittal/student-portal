import React from "react";
import Link from "next/link";
import { getSessionAndProfile } from "@/lib/auth-helpers";
import { Shield, Key, FileLock2, Terminal, ChevronRight, Lock } from "lucide-react";

export default async function IndexPage() {
  const { user } = await getSessionAndProfile();

  return (
    <div className="min-h-screen bg-radial from-slate-900 via-zinc-950 to-black text-white relative overflow-hidden flex flex-col justify-between">
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Decorative Glow elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <Shield className="h-5 w-5 text-blue-400" />
          </div>
          <span className="font-bold tracking-tight text-sm">SecureCampus</span>
        </div>
        <div>
          {user ? (
            <Link
              href="/dashboard"
              className="text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-4 py-2 rounded-xl font-semibold transition-colors"
            >
              Control Station
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="text-xs bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl font-semibold transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Main Hero */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20 text-center space-y-8 flex-1 flex flex-col justify-center">
        <div className="space-y-4">
          <span className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-3xs font-semibold uppercase tracking-wider rounded-full">
            <Lock className="h-3.5 w-3.5 mr-1" />
            <span>NATIVE ROW LEVEL SECURITY ACTIVE</span>
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            The Secure Student Portal
            <span className="block mt-1 bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
              Built on DevSecOps.
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-zinc-400 text-sm md:text-base leading-relaxed">
            SecureCampus represents the gold standard in academic portal security. Featuring Zero-Trust design, Row Level Security (RLS) enforcement, Zod input sanitization, and automated CI/CD security scanning.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="group flex items-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/10"
            >
              <span>Go to Control Dashboard</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="group flex items-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/10"
              >
                <span>Access Secure Portal</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/auth/signup"
                className="px-6 py-3.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-sm font-semibold rounded-xl transition-colors"
              >
                Register Credentials
              </Link>
            </>
          )}
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
          <div className="bg-zinc-900/40 border border-zinc-900/80 p-6 rounded-2xl space-y-3 backdrop-blur-md">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 w-fit">
              <Key className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200">Granular RBAC Auth</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Cryptographically verified sessions mapped to student, faculty, and administrator roles. Strict protected routes block unauthorized access.
            </p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-900/80 p-6 rounded-2xl space-y-3 backdrop-blur-md">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 w-fit">
              <FileLock2 className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200">PostgreSQL RLS Policies</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Row Level Security enforced directly inside the database layer, protecting user profiles against IDOR attacks at the database query level.
            </p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-900/80 p-6 rounded-2xl space-y-3 backdrop-blur-md">
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 w-fit">
              <Terminal className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200">DevSecOps Verified</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Continuous security validation checking dependency vulnerabilities, secret leak risks, and source code static analysis on every repository push.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 border-t border-zinc-900 text-center text-3xs text-zinc-500 font-semibold tracking-wider uppercase">
        © 2026 SecureCampus. All Rights Reserved. Encrypted under AES-256.
      </footer>
    </div>
  );
}
