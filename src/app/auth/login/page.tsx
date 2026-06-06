"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/app/actions";
import { Shield, Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import { loginSchema } from "@/lib/validations/schemas";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    // Client-side validation
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: any = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0]] = err.message;
        }
      });
      setValidationErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await loginAction({ email, password });
      if (res?.error) {
        setError(res.error);
      } else {
        router.refresh();
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError("An unexpected security error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123");
    setError(null);
    setValidationErrors({});
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-radial from-slate-900 via-zinc-950 to-black text-white px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl shadow-lg shadow-blue-500/5 backdrop-blur-md animate-pulse">
            <Shield className="h-10 w-10 text-blue-400" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
          SecureCampus
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Academic Information & Student Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 flex items-start space-x-2 text-sm text-red-300">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                University Email Address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2.5 bg-zinc-950/80 border ${
                    validationErrors.email ? "border-red-500/60" : "border-zinc-800 focus:border-blue-500/50"
                  } rounded-xl text-white placeholder-zinc-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all duration-250`}
                  placeholder="student@securecampus.edu"
                />
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-xs text-red-400">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Security Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2.5 bg-zinc-950/80 border ${
                    validationErrors.password ? "border-red-500/60" : "border-zinc-800 focus:border-blue-500/50"
                  } rounded-xl text-white placeholder-zinc-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all duration-250`}
                  placeholder="••••••••"
                />
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-xs text-red-400">{validationErrors.password}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-blue-900/10 cursor-pointer transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                    Verifying Identity...
                  </>
                ) : (
                  "Sign In Securely"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 flex justify-between items-center text-xs">
            <span className="text-zinc-500">Need credentials?</span>
            <Link
              href="/auth/signup"
              className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Register here
            </Link>
          </div>
        </div>

        {/* Demo Accounts Panel */}
        <div className="mt-6 bg-zinc-950/40 border border-zinc-900/80 rounded-2xl p-5 text-center">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Local Dev Demo Accounts (Password: Password123)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin("admin@securecampus.edu")}
              className="py-1.5 px-2 text-2xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-300 font-medium transition-colors cursor-pointer"
            >
              🛡️ Admin
            </button>
            <button
              onClick={() => handleQuickLogin("faculty@securecampus.edu")}
              className="py-1.5 px-2 text-2xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-300 font-medium transition-colors cursor-pointer"
            >
              🎓 Faculty
            </button>
            <button
              onClick={() => handleQuickLogin("student@securecampus.edu")}
              className="py-1.5 px-2 text-2xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-300 font-medium transition-colors cursor-pointer"
            >
              🧑‍🎓 Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
