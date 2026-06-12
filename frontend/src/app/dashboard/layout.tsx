"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  BrainCircuit,
  LayoutDashboard,
  Car,
  Users,
  ShieldAlert,
  Settings,
  BookOpen,
  LogOut,
  Trophy,
  Loader
} from "lucide-react";
import { getToken, removeToken, apiRequest, UserToken } from "../utils/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [token, setToken] = useState<UserToken | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchStats = async () => {
    try {
      const data = await apiRequest("/analytics/owner");
      setStats(data);
    } catch (e) {
      console.log("Error loading owner stats:", e);
    }
  };

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    const activeToken = getToken();
    if (!activeToken) {
      router.push("/login");
    } else {
      setToken(activeToken);
      setLoading(false);
      if (activeToken.role === "VEHICLE_OWNER") {
        fetchStats();
      }
    }
  }, [router, pathname]);

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-[var(--text-secondary)]">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-rose-500 animate-spin" />
          <span>Validating session...</span>
        </div>
      </div>
    );
  }

  const role = token?.role || "VEHICLE_OWNER";
  
  // Sidebar links based on role
  const sidebarLinks = [
    { href: "/dashboard", label: "Overview", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["ADMIN", "TRAFFIC_OFFICER", "VEHICLE_OWNER"] },
    { href: "/dashboard/violations", label: "Violations Feed", icon: <ShieldAlert className="w-5 h-5" />, roles: ["ADMIN", "TRAFFIC_OFFICER", "VEHICLE_OWNER"] },
    { href: "/dashboard/registry", label: "Vehicle Registry", icon: <Car className="w-5 h-5" />, roles: ["ADMIN", "TRAFFIC_OFFICER"] },
    { href: "/dashboard/users", label: "User Management", icon: <Users className="w-5 h-5" />, roles: ["ADMIN"] },
    { href: "/dashboard/learning", label: "Safety Modules", icon: <BookOpen className="w-5 h-5" />, roles: ["VEHICLE_OWNER"] },
    { href: "/dashboard/settings", label: "System settings", icon: <Settings className="w-5 h-5" />, roles: ["ADMIN"] }
  ];

  return (
    <div className="dashboard-shell min-h-screen text-[var(--text-primary)] flex flex-col md:flex-row relative">
      {/* Sidebar */}
      <aside className="dashboard-sidebar w-full md:w-64 border-r border-[var(--border-color)] flex flex-col p-5 shrink-0 relative z-20">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 mb-10 text-xl font-black text-[var(--text-primary)]">
          <span className="dashboard-brand-mark"><BrainCircuit className="w-5 h-5" /></span>
          <span>RoadPay AI</span>
        </Link>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 space-y-1.5">
          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest block mb-4">
            Navigation Menu
          </span>
          {sidebarLinks
            .filter((link) => link.roles.includes(role))
            .map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md font-medium transition-all ${
                    active
                      ? "dashboard-nav-active font-semibold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
        </nav>

        {/* Footer Logout */}
        <div className="pt-6 border-t border-[var(--border-color)] mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-[var(--text-secondary)] hover:text-black hover:bg-[var(--hover-bg)] rounded-md font-medium transition-all text-left"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 overflow-x-hidden">
        {/* Top Header Panel */}
        <header className="dashboard-header h-20 border-b border-[var(--border-color)] px-5 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-[var(--text-primary)] max-md:hidden">Safety Management Suite</h2>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-[var(--hover-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-full select-none uppercase tracking-wide">
              {role.replace("_", " ")}
            </span>
          </div>

          <div className="flex items-center gap-6">
            {/* Gamification progress if owner role */}
            {role === "VEHICLE_OWNER" && stats?.gamification && (
              <div className="flex items-center gap-4 border-r border-[var(--border-color)] pr-6 max-lg:hidden">
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-bold text-[var(--text-primary)]">Level {stats.gamification.level}</span>
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                    {stats.gamification.xp} XP ({stats.gamification.next_level_xp} XP to next level)
                  </span>
                </div>
                <div className="w-24 h-2 bg-[var(--hover-bg)] rounded-full overflow-hidden border border-[var(--border-color)]">
                  <div
                    className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                    style={{ width: `${stats.gamification.progress_percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Profile widget */}
            <div className="flex items-center gap-3 select-none">
              <div className="w-10 h-10 rounded-md bg-[var(--accent)] border border-black flex items-center justify-center text-black font-black">
                {token?.name?.charAt(0).toUpperCase() || "C"}
              </div>
              <div className="text-left leading-none max-sm:hidden">
                <span className="text-sm font-bold text-[var(--text-primary)] block mb-0.5">{token?.name || "Citizen"}</span>
                <span className="text-[10px] text-[var(--text-secondary)] font-medium">{token?.email || ""}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content viewport */}
        <main className="dashboard-content flex-1 p-5 md:p-8 overflow-y-auto min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
