import React from "react";
import { redirect } from "next/navigation";
import { getSessionAndProfile } from "@/lib/auth-helpers";
import ProfileForm from "@/components/ProfileForm";
import { UserCheck } from "lucide-react";

export default async function ProfilePage() {
  const { user, profile } = await getSessionAndProfile();

  if (!user || !profile) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <span className="text-3xs font-semibold tracking-widest text-indigo-400 uppercase">
          Identity Center
        </span>
        <h2 className="text-2xl font-extrabold text-white flex items-center space-x-2 mt-1">
          <UserCheck className="h-6 w-6 text-indigo-400 shrink-0" />
          <span>Student Profile Settings</span>
        </h2>
        <p className="text-zinc-400 text-sm mt-1">
          View or update your personal parameters. Sensitive fields such as email and role are locked to maintain security compliance.
        </p>
      </div>

      {/* Profile Editing Form Client Component */}
      <ProfileForm initialProfile={profile} />
    </div>
  );
}
