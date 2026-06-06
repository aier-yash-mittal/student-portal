"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signupAction } from "@/app/actions";
import { Shield, Lock, Mail, Loader2, AlertCircle, User, BookOpen, Hash, Phone, CheckCircle2 } from "lucide-react";
import { signupSchema } from "@/lib/validations/schemas";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "faculty">("student");
  const [department, setDepartment] = useState("");
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [phone, setPhone] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password requirements tracking computed synchronously during render
  const pwdMetrics = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    const formData = {
      email,
      password,
      fullName,
      role,
      department: department || undefined,
      enrollmentNo: enrollmentNo || undefined,
      phone: phone || undefined,
    };

    // Client-side validation
    const result = signupSchema.safeParse(formData);
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
      const res = await signupAction(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      }
    } catch (err: any) {
      setError("An unexpected security error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-radial from-slate-900 via-zinc-950 to-black text-white px-4 sm:px-6 lg:px-8 py-12">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl shadow-lg shadow-indigo-500/5 backdrop-blur-md animate-pulse">
            <Shield className="h-10 w-10 text-indigo-400" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
          Create Account
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Register new student or faculty profile in SecureCampus
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg z-10">
        <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex p-3 bg-green-500/10 border border-green-500/30 rounded-full text-green-400">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold text-green-400">Registration Complete</h3>
              <p className="text-sm text-zinc-300">
                Your profile has been created successfully. Redirecting you to login...
              </p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 flex items-start space-x-2 text-sm text-red-300">
                  <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Registration Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`py-2.5 text-center text-sm font-semibold rounded-xl border transition-all duration-200 cursor-pointer ${
                      role === "student"
                        ? "bg-blue-600/20 border-blue-500 text-blue-300 shadow-lg shadow-blue-500/5"
                        : "bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                    }`}
                  >
                    🧑‍🎓 Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("faculty")}
                    className={`py-2.5 text-center text-sm font-semibold rounded-xl border transition-all duration-200 cursor-pointer ${
                      role === "faculty"
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/5"
                        : "bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                    }`}
                  >
                    🎓 Faculty
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Full Name
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 bg-zinc-950/80 border ${
                      validationErrors.fullName ? "border-red-500/60" : "border-zinc-800 focus:border-blue-500/50"
                    } rounded-xl text-white placeholder-zinc-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all duration-250`}
                    placeholder="Ada Lovelace"
                  />
                </div>
                {validationErrors.fullName && (
                  <p className="mt-1 text-xs text-red-400">{validationErrors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  University Email
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 bg-zinc-950/80 border ${
                      validationErrors.email ? "border-red-500/60" : "border-zinc-800 focus:border-blue-500/50"
                    } rounded-xl text-white placeholder-zinc-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all duration-250`}
                    placeholder="student@securecampus.edu"
                  />
                </div>
                {validationErrors.email && (
                  <p className="mt-1 text-xs text-red-400">{validationErrors.email}</p>
                )}
              </div>

              {/* Role Specific Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {role === "student" && (
                  <div>
                    <label htmlFor="enrollmentNo" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      Enrollment Number
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className="h-5 w-5 text-zinc-500" />
                      </div>
                      <input
                        id="enrollmentNo"
                        type="text"
                        value={enrollmentNo}
                        onChange={(e) => setEnrollmentNo(e.target.value)}
                        className={`block w-full pl-10 pr-3 py-2 bg-zinc-950/80 border ${
                          validationErrors.enrollmentNo ? "border-red-500/60" : "border-zinc-800 focus:border-blue-500/50"
                        } rounded-xl text-white placeholder-zinc-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all duration-250`}
                        placeholder="SC20260001"
                      />
                    </div>
                    {validationErrors.enrollmentNo && (
                      <p className="mt-1 text-xs text-red-400">{validationErrors.enrollmentNo}</p>
                    )}
                  </div>
                )}

                <div>
                  <label htmlFor="department" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Department
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BookOpen className="h-5 w-5 text-zinc-500" />
                    </div>
                    <input
                      id="department"
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className={`block w-full pl-10 pr-3 py-2 bg-zinc-950/80 border ${
                        validationErrors.department ? "border-red-500/60" : "border-zinc-800 focus:border-blue-500/50"
                      } rounded-xl text-white placeholder-zinc-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all duration-250`}
                      placeholder="Computer Science"
                    />
                  </div>
                  {validationErrors.department && (
                    <p className="mt-1 text-xs text-red-400">{validationErrors.department}</p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Phone Number
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    id="phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 bg-zinc-950/80 border ${
                      validationErrors.phone ? "border-red-500/60" : "border-zinc-800 focus:border-blue-500/50"
                    } rounded-xl text-white placeholder-zinc-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all duration-250`}
                    placeholder="+1 555-0199"
                  />
                </div>
                {validationErrors.phone && (
                  <p className="mt-1 text-xs text-red-400">{validationErrors.phone}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Account Password
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 bg-zinc-950/80 border ${
                      validationErrors.password ? "border-red-500/60" : "border-zinc-800 focus:border-blue-500/50"
                    } rounded-xl text-white placeholder-zinc-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all duration-250`}
                    placeholder="••••••••"
                  />
                </div>
                {validationErrors.password && (
                  <p className="mt-1 text-xs text-red-400">{validationErrors.password}</p>
                )}

                {/* Password Strength Checklist */}
                {password.length > 0 && (
                  <div className="mt-3 p-3 bg-zinc-950/50 border border-zinc-900 rounded-xl space-y-1.5 text-xs text-zinc-400">
                    <p className="font-semibold text-2xs uppercase tracking-wider text-zinc-500 mb-1">Password Requirements</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="flex items-center space-x-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${pwdMetrics.length ? "bg-green-400" : "bg-zinc-600"}`} />
                        <span className={pwdMetrics.length ? "text-green-300" : ""}>Min 8 characters</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${pwdMetrics.upper ? "bg-green-400" : "bg-zinc-600"}`} />
                        <span className={pwdMetrics.upper ? "text-green-300" : ""}>Uppercase letter</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${pwdMetrics.lower ? "bg-green-400" : "bg-zinc-600"}`} />
                        <span className={pwdMetrics.lower ? "text-green-300" : ""}>Lowercase letter</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${pwdMetrics.number ? "bg-green-400" : "bg-zinc-600"}`} />
                        <span className={pwdMetrics.number ? "text-green-300" : ""}>One number</span>
                      </div>
                      <div className="flex items-center space-x-1.5 col-span-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${pwdMetrics.special ? "bg-green-400" : "bg-zinc-600"}`} />
                        <span className={pwdMetrics.special ? "text-green-300" : ""}>One special character (!@#$ etc)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-indigo-900/10 cursor-pointer transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Creating Security Profile...
                    </>
                  ) : (
                    "Register Profile"
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 flex justify-between items-center text-xs">
            <span className="text-zinc-500">Already registered?</span>
            <Link
              href="/auth/login"
              className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
