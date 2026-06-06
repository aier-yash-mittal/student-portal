import React from "react";
import { redirect } from "next/navigation";
import { getSessionAndProfile } from "@/lib/auth-helpers";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getSessionAndProfile();

  if (!user || !profile) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-950 text-white font-sans">
      {/* Dynamic Role-Based Sidebar */}
      <Sidebar profile={profile} />

      {/* Main Page Area */}
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-10">
        <div className="max-w-7xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
