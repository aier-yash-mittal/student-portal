"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions";
import {
  Shield,
  LayoutDashboard,
  Search,
  UserCircle,
  LogOut,
  Menu,
  X,
  FileText,
} from "lucide-react";

interface SidebarProps {
  profile: {
    id: string;
    email: string;
    full_name: string;
    role: "student" | "faculty" | "admin";
    avatar_url?: string;
  };
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out from SecureCampus?")) {
      setLoggingOut(true);
      const res = await logoutAction();
      if (res?.error) {
        alert(res.error);
        setLoggingOut(false);
      } else {
        router.refresh();
        router.push("/auth/login");
      }
    }
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["student", "faculty", "admin"],
    },
    {
      name: "Student Search",
      href: "/dashboard/search",
      icon: Search,
      roles: ["faculty", "admin"],
    },
    {
      name: "My Profile",
      href: "/dashboard/profile",
      icon: UserCircle,
      roles: ["student", "faculty", "admin"],
    },
  ];

  // Admins can see the audit logs directly in the app
  if (profile.role === "admin") {
    navItems.push({
      name: "Audit Logs",
      href: "/dashboard/audit-logs",
      icon: FileText,
      roles: ["admin"],
    });
  }

  const filteredItems = navItems.filter((item) => item.roles.includes(profile.role));

  const roleLabels = {
    admin: { text: "Administrator", color: "bg-red-500/10 border-red-500/30 text-red-400" },
    faculty: { text: "Faculty Member", color: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" },
    student: { text: "Student", color: "bg-blue-500/10 border-blue-500/30 text-blue-400" },
  };

  const currentRole = roleLabels[profile.role] || roleLabels.student;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-900 text-white">
      {/* Header */}
      <div className="flex items-center space-x-3 px-6 py-6 border-b border-zinc-900">
        <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <Shield className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            SecureCampus
          </h1>
          <p className="text-3xs text-zinc-500 font-semibold tracking-widest uppercase">
            Secured Network
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-zinc-900 border border-zinc-800 text-white shadow-inner"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-blue-400" : "text-zinc-500"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Profile Card & Logout */}
      <div className="p-4 border-t border-zinc-900 bg-zinc-950/60">
        <div className="flex items-center space-x-3 p-3 bg-zinc-900/50 border border-zinc-900 rounded-2xl mb-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-blue-500/10 shrink-0">
            {profile.full_name ? profile.full_name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() : "?"}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold text-zinc-200 truncate">{profile.full_name}</h4>
            <span className={`inline-block mt-0.5 px-2 py-0.5 text-3xs font-semibold uppercase tracking-wider rounded-md border ${currentRole.color}`}>
              {currentRole.text}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-zinc-900 hover:bg-red-950/20 hover:text-red-400 hover:border-red-500/30 border border-zinc-800 rounded-xl text-sm text-zinc-400 font-semibold transition-all duration-250 cursor-pointer disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          <span>{loggingOut ? "Logging out..." : "Disconnect"}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-zinc-950 border-b border-zinc-900 text-white z-20">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-blue-400" />
          <span className="font-bold tracking-tight text-sm">SecureCampus</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-lg"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden md:flex flex-col w-64 h-screen shrink-0 sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar (Drawer Overlay) */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <aside className="relative flex flex-col w-72 h-full z-40 animate-slide-in">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
