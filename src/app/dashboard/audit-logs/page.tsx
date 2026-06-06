import React from "react";
import { redirect } from "next/navigation";
import { getSessionAndProfile } from "@/lib/auth-helpers";
import { createServerClient } from "@/lib/supabase/server";
import AuditLogsTable from "@/components/AuditLogsTable";
import { Shield } from "lucide-react";

export default async function AuditLogsPage() {
  const { user, profile } = await getSessionAndProfile();

  // Route security: Only admins can view audit logs
  if (!user || !profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const supabase = await createServerClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const logs = data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-3xs font-semibold tracking-widest text-red-400 uppercase">
            Secured Audit Station
          </span>
          <h2 className="text-2xl font-extrabold text-white flex items-center space-x-2 mt-1">
            <Shield className="h-6 w-6 text-red-500 shrink-0" />
            <span>System Security Audit Logs</span>
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            Immutable ledger tracking session authorizations, student searches, and personal profile modifications.
          </p>
        </div>
      </div>

      {/* Interactive Table Client Component */}
      <AuditLogsTable initialLogs={logs} />
    </div>
  );
}
