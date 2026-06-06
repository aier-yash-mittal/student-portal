import React from "react";
import { redirect } from "next/navigation";
import { getSessionAndProfile } from "@/lib/auth-helpers";
import StudentSearch from "@/components/StudentSearch";
import { Search } from "lucide-react";

export default async function SearchPage() {
  const { user, profile } = await getSessionAndProfile();

  // Route authorization check: Only Faculty and Admins can access search
  if (!user || !profile || (profile.role !== "faculty" && profile.role !== "admin")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <span className="text-3xs font-semibold tracking-widest text-blue-400 uppercase">
          Academic Registry
        </span>
        <h2 className="text-2xl font-extrabold text-white flex items-center space-x-2 mt-1">
          <Search className="h-6 w-6 text-blue-400 shrink-0" />
          <span>Student Search System</span>
        </h2>
        <p className="text-zinc-400 text-sm mt-1">
          Authorized query station. Run granular lookups by name, enrollment codes, or department groupings. All queries are audited and bound under security controls.
        </p>
      </div>

      {/* Student Search Client Component */}
      <StudentSearch />
    </div>
  );
}
