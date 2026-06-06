"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { logSearchAction } from "@/app/actions";
import {
  Search,
  BookOpen,
  Hash,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  ShieldAlert,
} from "lucide-react";

interface Student {
  id: string;
  email: string;
  full_name: string;
  role: "student" | "faculty" | "admin";
  enrollment_no?: string;
  department?: string;
  phone?: string;
  avatar_url?: string;
}

const ITEMS_PER_PAGE = 3;

export default function StudentSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [students, setStudents] = useState<Student[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Departments list for filter options
  const [departments, setDepartments] = useState<string[]>([]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserClient();
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Build Query
      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .eq("role", "student");

      if (searchTerm.trim()) {
        const term = `%${searchTerm.trim()}%`;
        query = query.or(`full_name.ilike.${term},enrollment_no.ilike.${term},department.ilike.${term}`);
      }

      if (deptFilter !== "ALL") {
        query = query.eq("department", deptFilter);
      }

      // Add pagination
      query = query.range(from, to);

      const { data, error: fetchErr, count } = await query;

      if (fetchErr) throw fetchErr;

      setStudents(data || []);
      const countVal = count || 0;
      setTotalCount(countVal);

      // Perform Audit Logging of the search event on the server
      if (searchTerm.trim() || deptFilter !== "ALL") {
        const queryText = `Search: "${searchTerm}", Dept: "${deptFilter}"`;
        await logSearchAction(queryText, countVal);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("An unauthorized IDOR or query error occurred. Permission Denied.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, deptFilter]);

  // Load distinct departments on mount
  useEffect(() => {
    async function loadDepts() {
      try {
        const supabase = createBrowserClient();
        const { data } = await supabase.from("profiles").select("department").eq("role", "student");
        if (data) {
          const depts = Array.from(
            new Set((data as { department: string | null }[]).map((s) => s.department).filter(Boolean))
          ) as string[];
          setDepartments(depts);
        }
      } catch (err) {
        console.error("Error loading departments list:", err);
      }
    }
    loadDepts();
  }, []);

  // Trigger search when paging, filter changes, or search term changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 0);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, deptFilter, fetchStudents]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Search Bar Card */}
      <div className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between backdrop-blur-md">
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder="Search by student name, enrollment no, or department..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full pl-10 pr-3 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-blue-500/50 rounded-xl text-sm text-white placeholder-zinc-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all duration-200"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <BookOpen className="h-4 w-4 text-zinc-500 shrink-0" />
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full sm:w-48 px-3 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-blue-500/50 rounded-xl text-sm text-white outline-none transition-all duration-200"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start space-x-2 text-sm text-red-300">
          <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Students Results List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-12 text-center text-zinc-500">
            <Users className="h-10 w-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm">No students matched the query filters.</p>
          </div>
        ) : (
          students.map((student) => (
            <div
              key={student.id}
              className="bg-zinc-900/40 border border-zinc-900 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-zinc-800 transition-all duration-200 backdrop-blur-md relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-md overflow-hidden shrink-0 border border-zinc-800 shadow-md">
                  {student.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={student.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    student.full_name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200">{student.full_name}</h4>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-3xs font-semibold uppercase tracking-wider text-zinc-500">
                    <span className="flex items-center space-x-1">
                      <Hash className="h-3 w-3 text-zinc-600" />
                      <span>{student.enrollment_no || "No Enrollment No"}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <BookOpen className="h-3 w-3 text-zinc-600" />
                      <span>{student.department || "No Department"}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Secure contact credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs md:text-right w-full md:w-auto border-t md:border-t-0 border-zinc-900 pt-4 md:pt-0">
                <div className="space-y-0.5">
                  <span className="text-4xs uppercase tracking-wider text-zinc-500 block">Email Address</span>
                  <a href={`mailto:${student.email}`} className="text-blue-400 hover:underline flex items-center md:justify-end space-x-1">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    <span className="truncate max-w-[180px]">{student.email}</span>
                  </a>
                </div>
                <div className="space-y-0.5">
                  <span className="text-4xs uppercase tracking-wider text-zinc-500 block">Phone Connection</span>
                  <span className="text-zinc-300 flex items-center md:justify-end space-x-1 font-mono">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    <span>{student.phone || "Not set"}</span>
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center py-4 text-xs">
          <span className="text-zinc-500">
            Page <span className="text-zinc-300 font-bold">{currentPage}</span> of <span className="text-zinc-300 font-bold">{totalPages}</span> ({totalCount} students)
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 disabled:opacity-30 disabled:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 disabled:opacity-30 disabled:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
