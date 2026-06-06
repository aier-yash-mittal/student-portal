"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateProfileAction } from "@/app/actions";
import { createBrowserClient } from "@/lib/supabase/client";
import { profileUpdateSchema } from "@/lib/validations/schemas";
import { isMockEnabled } from "@/lib/supabase/config";
import {
  User,
  Phone,
  BookOpen,
  Hash,
  Mail,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Camera,
} from "lucide-react";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: "student" | "faculty" | "admin";
  enrollment_no?: string;
  department?: string;
  phone?: string;
  avatar_url?: string;
}

interface ProfileFormProps {
  initialProfile: Profile;
}

export default function ProfileForm({ initialProfile }: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fullName, setFullName] = useState(initialProfile.full_name || "");
  const [phone, setPhone] = useState(initialProfile.phone || "");
  const [department, setDepartment] = useState(initialProfile.department || "");
  const [enrollmentNo, setEnrollmentNo] = useState(initialProfile.enrollment_no || "");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url || "");

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<any>({});

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic client side checks
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be less than 2MB.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const isMock = isMockEnabled();
      
      if (isMock) {
        // Mock upload: read as Base64 Data URL and set immediately
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setAvatarUrl(base64String);
          setUploading(false);
          setSuccess("Photo loaded successfully. Save profile to apply changes.");
        };
        reader.readAsDataURL(file);
      } else {
        // Live Supabase Storage Upload
        const supabase = createBrowserClient();
        const fileExt = file.name.split(".").pop();
        const filePath = `${initialProfile.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
        setAvatarUrl(data.publicUrl);
        setSuccess("Photo uploaded successfully. Save profile to apply changes.");
        setUploading(false);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload avatar image.");
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setValidationErrors({});

    const formData = {
      fullName,
      phone,
      department,
      enrollmentNo,
      avatarUrl,
    };

    // Client Zod validation
    const result = profileUpdateSchema.safeParse(formData);
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
      const res = await updateProfileAction(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess("Your profile has been securely updated.");
        router.refresh();
      }
    } catch (err: any) {
      setError("An unexpected validation failure occurred. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start space-x-2 text-sm text-red-300">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-950/40 border border-green-500/30 flex items-start space-x-2 text-sm text-green-300">
          <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-zinc-900/40 border border-zinc-900 rounded-3xl p-6 md:p-8 backdrop-blur-md space-y-8">
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-zinc-900">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white text-2xl shadow-xl shadow-blue-500/10 overflow-hidden border border-zinc-800">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                fullName ? fullName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() : "?"
              )}
            </div>
            <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
              {uploading ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </div>
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h4 className="text-sm font-semibold text-zinc-200">Profile Picture</h4>
            <p className="text-2xs text-zinc-500">
              PNG, JPG or WEBP. Max size of 2MB. Click photo to change.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Read-Only Account Details */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              University Email Address
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-zinc-600" />
              </div>
              <input
                type="text"
                disabled
                value={initialProfile.email}
                className="block w-full pl-10 pr-3 py-2.5 bg-zinc-950/30 border border-zinc-900 rounded-xl text-zinc-400 outline-none cursor-not-allowed text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Access Role
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Shield className="h-5 w-5 text-zinc-600" />
              </div>
              <input
                type="text"
                disabled
                value={initialProfile.role.toUpperCase()}
                className="block w-full pl-10 pr-3 py-2.5 bg-zinc-950/30 border border-zinc-900 rounded-xl text-zinc-400 outline-none cursor-not-allowed text-sm"
              />
            </div>
          </div>

          {/* Editable Fields */}
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
                className={`block w-full pl-10 pr-3 py-2.5 bg-zinc-950/80 border ${
                  validationErrors.fullName ? "border-red-500/60" : "border-zinc-800 focus:border-blue-500/50"
                } rounded-xl text-sm text-white placeholder-zinc-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all duration-200`}
                placeholder="Ada Lovelace"
              />
            </div>
            {validationErrors.fullName && (
              <p className="mt-1 text-xs text-red-400">{validationErrors.fullName}</p>
            )}
          </div>

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
                className={`block w-full pl-10 pr-3 py-2.5 bg-zinc-950/80 border ${
                  validationErrors.phone ? "border-red-500/60" : "border-zinc-800 focus:border-blue-500/50"
                } rounded-xl text-sm text-white placeholder-zinc-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all duration-200`}
                placeholder="+1 555-0199"
              />
            </div>
            {validationErrors.phone && (
              <p className="mt-1 text-xs text-red-400">{validationErrors.phone}</p>
            )}
          </div>

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
                className={`block w-full pl-10 pr-3 py-2.5 bg-zinc-950/80 border ${
                  validationErrors.department ? "border-red-500/60" : "border-zinc-800 focus:border-blue-500/50"
                } rounded-xl text-sm text-white placeholder-zinc-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all duration-200`}
                placeholder="Computer Science"
              />
            </div>
            {validationErrors.department && (
              <p className="mt-1 text-xs text-red-400">{validationErrors.department}</p>
            )}
          </div>

          <div>
            <label htmlFor="enrollmentNo" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Enrollment / Faculty ID
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
                className={`block w-full pl-10 pr-3 py-2.5 bg-zinc-950/80 border ${
                  validationErrors.enrollmentNo ? "border-red-500/60" : "border-zinc-800 focus:border-blue-500/50"
                } rounded-xl text-sm text-white placeholder-zinc-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all duration-200`}
                placeholder="SC20260001"
              />
            </div>
            {validationErrors.enrollmentNo && (
              <p className="mt-1 text-xs text-red-400">{validationErrors.enrollmentNo}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || uploading}
          className="flex justify-center py-3 px-6 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-blue-900/10 cursor-pointer transition-all duration-200"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
              Encrypting & Saving...
            </>
          ) : (
            "Save Changes Securely"
          )}
        </button>
      </div>
    </form>
  );
}
