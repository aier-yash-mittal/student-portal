"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Mock log data over the last 7 days for visual analytics
const chartData = [
  { day: "Mon", logins: 42, searches: 18 },
  { day: "Tue", logins: 55, searches: 24 },
  { day: "Wed", logins: 48, searches: 30 },
  { day: "Thu", logins: 70, searches: 45 },
  { day: "Fri", logins: 65, searches: 38 },
  { day: "Sat", logins: 28, searches: 12 },
  { day: "Sun", logins: 34, searches: 15 },
];

export default function DashboardChart() {
  return (
    <div className="h-[300px] w-full bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 backdrop-blur-md">
      <div className="flex flex-col mb-4">
        <h3 className="text-sm font-semibold text-zinc-300">Security Access Logs</h3>
        <p className="text-2xs text-zinc-500">System logins vs search queries (Last 7 Days)</p>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSearches" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              borderRadius: "0.75rem",
              color: "#fff",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="logins"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorLogins)"
            name="Authorized Logins"
          />
          <Area
            type="monotone"
            dataKey="searches"
            stroke="#818cf8"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorSearches)"
            name="Search Queries"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
