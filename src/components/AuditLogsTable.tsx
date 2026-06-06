"use client";

import React, { useState } from "react";
import { Search, Filter, ShieldAlert, CheckCircle, Info, ChevronDown, ChevronUp } from "lucide-react";

interface AuditLog {
  id: string;
  user_id: string | null;
  actor_email: string;
  action: string;
  ip_address: string;
  status: string;
  details: string;
  created_at: string;
}

interface AuditLogsTableProps {
  initialLogs: AuditLog[];
}

export default function AuditLogsTable({ initialLogs }: AuditLogsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const filteredLogs = initialLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip_address.includes(searchTerm);

    const matchesStatus =
      statusFilter === "ALL" || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <div className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between backdrop-blur-md">
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder="Search logs by action, email, or IP address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 bg-zinc-950/80 border border-zinc-800 focus:border-blue-500/50 rounded-xl text-xs text-white placeholder-zinc-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all duration-200"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-zinc-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full md:w-40 px-3 py-2 bg-zinc-950/80 border border-zinc-800 focus:border-blue-500/50 rounded-xl text-xs text-white outline-none transition-all duration-200"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success Only</option>
            <option value="FAILED">Failed Only</option>
          </select>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-900 text-zinc-400 font-semibold tracking-wider">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Security Action</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No matching security audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedRow === log.id;
                  const dateStr = new Date(log.created_at).toLocaleString();
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-zinc-900/20 transition-colors duration-150">
                        <td className="px-6 py-4 text-zinc-400 whitespace-nowrap">{dateStr}</td>
                        <td className="px-6 py-4 font-bold text-zinc-200">{log.action}</td>
                        <td className="px-6 py-4 text-zinc-300">{log.actor_email}</td>
                        <td className="px-6 py-4 text-zinc-400 font-mono">{log.ip_address}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md border text-3xs font-semibold ${
                              log.status === "SUCCESS"
                                ? "bg-green-500/10 border-green-500/20 text-green-400"
                                : "bg-red-500/10 border-red-500/20 text-red-400"
                            }`}
                          >
                            {log.status === "SUCCESS" ? (
                              <CheckCircle className="h-3 w-3 shrink-0" />
                            ) : (
                              <ShieldAlert className="h-3 w-3 shrink-0" />
                            )}
                            <span>{log.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => toggleRow(log.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 text-3xs bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 font-medium rounded-lg transition-colors cursor-pointer"
                          >
                            <span>Details</span>
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-zinc-950/40">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="p-4 bg-zinc-950/80 border border-zinc-900 rounded-xl space-y-2">
                              <div className="flex items-center space-x-1.5 text-zinc-400 text-3xs uppercase font-semibold tracking-wider">
                                <Info className="h-3.5 w-3.5 text-blue-400" />
                                <span>Security Log Payload Details</span>
                              </div>
                              <pre className="text-3xs font-mono text-indigo-300 whitespace-pre-wrap break-all overflow-x-auto bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                                {(() => {
                                  try {
                                    const parsed = JSON.parse(log.details);
                                    return JSON.stringify(parsed, null, 2);
                                  } catch {
                                    return log.details || "{}";
                                  }
                                })()}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
