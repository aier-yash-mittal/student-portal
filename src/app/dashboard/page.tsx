import React from "react";
import { redirect } from "next/navigation";
import { getSessionAndProfile } from "@/lib/auth-helpers";
import { createServerClient } from "@/lib/supabase/server";
import DashboardChart from "@/components/DashboardChart";
import {
  Award,
  BookOpen,
  CalendarCheck2,
  DollarSign,
  Users,
  Fingerprint,
  Activity,
  ShieldAlert,
  Server,
  FileSpreadsheet,
  Clock,
} from "lucide-react";

export default async function DashboardPage() {
  const { user, profile } = await getSessionAndProfile();

  if (!user || !profile) {
    redirect("/auth/login");
  }

  const supabase = await createServerClient();

  // 1. Fetch Audit Logs for the Activity log section
  let logsQuery = supabase.from("audit_logs").select("*");
  if (profile.role === "student") {
    // RLS/Security policy: Students only see their own audit events
    logsQuery = logsQuery.eq("user_id", user.id);
  } else if (profile.role === "faculty") {
    // Faculty can see their own logs and student searches
    logsQuery = logsQuery.or(`user_id.eq.${user.id},action.eq.STUDENT_SEARCH`);
  }
  // Admins can see everything

  interface AuditLogItem {
    id: string;
    user_id: string | null;
    actor_email: string;
    action: string;
    ip_address: string;
    status: string;
    details: string;
    created_at: string;
  }

  const { data: rawLogs } = await logsQuery
    .order("created_at", { ascending: false })
    .limit(5);

  const logs = (rawLogs as unknown as AuditLogItem[]) || [];

  // 2. Fetch stats based on roles
  const studentStats = { gpa: "3.92", credits: "90", attendance: "96%", fees: "$0" };
  const facultyStats = { totalStudents: 0, courses: 3, auditsRun: 0, uptime: "99.98%" };
  const adminStats = { totalUsers: 0, auditLogsCount: 0, alertsCount: 0, apiSpeed: "45ms" };

  if (profile.role === "admin" || profile.role === "faculty") {
    // Get total student count
    const { count: studentCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student");

    facultyStats.totalStudents = studentCount || 0;
    adminStats.totalUsers = (studentCount || 0) + 1; // simple aggregation

    // Get total audits count
    const { count: auditCount } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact", head: true });

    adminStats.auditLogsCount = auditCount || 0;

    // Get alerts (FAILED attempts)
    const { count: failCount } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .eq("status", "FAILED");

    adminStats.alertsCount = failCount || 0;

    // Get audits run by active faculty
    const { count: facultyAudits } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("action", "STUDENT_SEARCH");

    facultyStats.auditsRun = facultyAudits || 0;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-zinc-900/60 to-purple-900/20 border border-zinc-900 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-2">
          <span className="text-3xs font-semibold tracking-widest text-blue-400 uppercase">
            Portal Control Station
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Welcome back, {profile.full_name}
          </h2>
          <p className="text-zinc-400 text-sm max-w-xl">
            You are authenticated under a secured session. All transactions, queries, and modifications are verified and logged under the campus DevSecOps protocol.
          </p>
        </div>
      </div>

      {/* Role-Specific Stats Cards */}
      {profile.role === "student" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xs text-zinc-500 font-semibold uppercase tracking-wider">Cumulative GPA</p>
              <h3 className="text-xl font-bold text-zinc-100 mt-1">{studentStats.gpa}</h3>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xs text-zinc-500 font-semibold uppercase tracking-wider">Completed Credits</p>
              <h3 className="text-xl font-bold text-zinc-100 mt-1">{studentStats.credits} / 120</h3>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
              <CalendarCheck2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xs text-zinc-500 font-semibold uppercase tracking-wider">Class Attendance</p>
              <h3 className="text-xl font-bold text-zinc-100 mt-1">{studentStats.attendance}</h3>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xs text-zinc-500 font-semibold uppercase tracking-wider">Outstanding Balance</p>
              <h3 className="text-xl font-bold text-zinc-100 mt-1">{studentStats.fees}</h3>
            </div>
          </div>
        </div>
      )}

      {profile.role === "faculty" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xs text-zinc-500 font-semibold uppercase tracking-wider">Total Enrolled Students</p>
              <h3 className="text-xl font-bold text-zinc-100 mt-1">{facultyStats.totalStudents}</h3>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xs text-zinc-500 font-semibold uppercase tracking-wider">Active Semesters</p>
              <h3 className="text-xl font-bold text-zinc-100 mt-1">{facultyStats.courses} Courses</h3>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400">
              <Fingerprint className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xs text-zinc-500 font-semibold uppercase tracking-wider">Audit Search Queries</p>
              <h3 className="text-xl font-bold text-zinc-100 mt-1">{facultyStats.auditsRun} Executed</h3>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xs text-zinc-500 font-semibold uppercase tracking-wider">Database Node Uptime</p>
              <h3 className="text-xl font-bold text-zinc-100 mt-1">{facultyStats.uptime}</h3>
            </div>
          </div>
        </div>
      )}

      {profile.role === "admin" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xs text-zinc-500 font-semibold uppercase tracking-wider">Total Accounts</p>
              <h3 className="text-xl font-bold text-zinc-100 mt-1">{adminStats.totalUsers} Profiles</h3>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xs text-zinc-500 font-semibold uppercase tracking-wider">Recorded Audit Logs</p>
              <h3 className="text-xl font-bold text-zinc-100 mt-1">{adminStats.auditLogsCount} Logs</h3>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xs text-zinc-500 font-semibold uppercase tracking-wider">Failed Security Attempts</p>
              <h3 className="text-xl font-bold text-zinc-100 mt-1">{adminStats.alertsCount} Alerts</h3>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xs text-zinc-500 font-semibold uppercase tracking-wider">API Average Latency</p>
              <h3 className="text-xl font-bold text-zinc-100 mt-1">{adminStats.apiSpeed}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Main Content split: Chart & Audit logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column (2/3 width on large screens) */}
        {(profile.role === "admin" || profile.role === "faculty") && (
          <div className="lg:col-span-2">
            <DashboardChart />
          </div>
        )}

        {/* Profile overview card for student (in place of chart) */}
        {profile.role === "student" && (
          <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-900 rounded-2xl p-6 backdrop-blur-md">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span>Personal Student Credentials</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-3xs uppercase font-semibold text-zinc-500">Full Name</span>
                <p className="text-zinc-200">{profile.full_name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-3xs uppercase font-semibold text-zinc-500">Enrollment Number</span>
                <p className="text-zinc-200">{profile.enrollment_no || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-3xs uppercase font-semibold text-zinc-500">Department</span>
                <p className="text-zinc-200">{profile.department || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-3xs uppercase font-semibold text-zinc-500">Phone Contact</span>
                <p className="text-zinc-200">{profile.phone || "N/A"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Audit / Activity Log Card */}
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 backdrop-blur-md flex flex-col h-[300px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-300">Security Log Ledger</h3>
              <p className="text-2xs text-zinc-500">Recent events logged in current scope</p>
            </div>
            <Clock className="h-4 w-4 text-zinc-500" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                No security activities logged yet.
              </div>
            ) : (
              logs.map((log) => {
                const dateStr = new Date(log.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={log.id}
                    className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl space-y-1 hover:border-zinc-800 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-300 truncate max-w-[140px]">
                        {log.action}
                      </span>
                      <span
                        className={`text-4xs px-1.5 py-0.5 rounded-md border font-semibold ${
                          log.status === "SUCCESS"
                            ? "bg-green-500/10 border-green-500/30 text-green-400"
                            : "bg-red-500/10 border-red-500/30 text-red-400"
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-3xs text-zinc-500">
                      <span>{log.actor_email}</span>
                      <span>{dateStr}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
