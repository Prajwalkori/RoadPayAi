"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Shield,
  FileSpreadsheet,
  Award,
  UploadCloud,
  FileCheck,
  UserPlus,
  Loader,
  RefreshCw,
  Eye,
  Camera,
  Coins,
  ChevronRight,
  BookOpen,
  Car
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { apiRequest, getToken, getFileUrl, UserToken } from "../utils/api";
import Link from "next/link";

export default function DashboardPage() {
  const [token, setToken] = useState<UserToken | null>(null);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [ownerStats, setOwnerStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [recentViolations, setRecentViolations] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDashboard = async () => {
    setRefreshing(true);
    try {
      const activeToken = getToken();
      if (!activeToken) return;
      setToken(activeToken);

      if (activeToken.role === "ADMIN") {
        const stats = await apiRequest("/analytics/admin");
        setAdminStats(stats);
        
        const violationsRes = await apiRequest("/violations?limit=5");
        setRecentViolations(violationsRes.violations || []);
      } else if (activeToken.role === "TRAFFIC_OFFICER") {
        const violationsRes = await apiRequest("/violations?limit=5");
        setRecentViolations(violationsRes.violations || []);
      } else if (activeToken.role === "VEHICLE_OWNER") {
        const oStats = await apiRequest("/analytics/owner");
        setOwnerStats(oStats);
        
        const violationsRes = await apiRequest("/violations?limit=5");
        setRecentViolations(violationsRes.violations || []);
      }
    } catch (e) {
      console.log("Error loading dashboard data:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setUploadResult(null);
    const file = files[0];
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await apiRequest("/violations/upload", {
        method: "POST",
        body: formData,
      });
      setUploadResult(res);
      loadDashboard();
    } catch (err: any) {
      alert(err.message || "Failed to analyze evidence image.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-rose-500 animate-spin" />
          <span>Compiling dashboard analytics...</span>
        </div>
      </div>
    );
  }

  const role = token?.role || "VEHICLE_OWNER";

  return (
    <div className="space-y-12 animate-fade-in text-[var(--text-primary)]">
      {/* Welcome Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)]">Welcome Back, {token?.name}</h1>
          <p className="text-[var(--text-secondary)] text-md mt-1.5">Here is a summary of RoadPay safety metrics today.</p>
        </div>
        <button
          onClick={loadDashboard}
          disabled={refreshing}
          className="px-5 py-2.5 text-xs font-bold bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl flex items-center gap-2 transition-all active:scale-98 disabled:opacity-50 shrink-0 self-start md:self-auto shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh Console</span>
        </button>
      </div>

      {/* ADMIN DASHBOARD VIEW */}
      {role === "ADMIN" && adminStats && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="glass-panel-static p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full blur-2xl" />
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Total Violations</span>
                  <h3 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] mt-2">{adminStats.total_violations}</h3>
                </div>
                <div className="p-3 bg-rose-500/[0.08] border border-rose-500/10 text-rose-500 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="glass-panel-static p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl" />
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Fines Settle Revenue</span>
                  <h3 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] mt-2">₹{adminStats.revenue_collected}</h3>
                </div>
                <div className="p-3 bg-emerald-500/[0.08] border border-emerald-500/10 text-emerald-500 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="glass-panel-static p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/5 rounded-full blur-2xl" />
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Pending / Overdue</span>
                  <h3 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] mt-2">
                    {adminStats.pending_payments} <span className="text-[var(--text-secondary)] text-sm font-bold">/ {adminStats.overdue_payments}</span>
                  </h3>
                </div>
                <div className="p-3 bg-yellow-500/[0.08] border border-yellow-500/10 text-yellow-500 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="glass-panel-static p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-2xl" />
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Scholar Mitigations</span>
                  <h3 className="text-3xl md:text-4xl font-black text-cyan-500 mt-2">₹{adminStats.money_saved}</h3>
                </div>
                <div className="p-3 bg-cyan-500/[0.08] border border-cyan-500/10 text-cyan-500 rounded-xl">
                  <Coins className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Graphs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Revenue Area Chart */}
            <div className="glass-panel-static p-8">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Revenue Settlement Trend</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={adminStats.revenue_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} />
                    <YAxis stroke="var(--text-secondary)" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--text-primary)", borderRadius: "12px" }} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (₹)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Violations Bar Chart */}
            <div className="glass-panel-static p-8">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Violation Statistics Breakdown</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adminStats.violation_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} />
                    <YAxis stroke="var(--text-secondary)" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--text-primary)", borderRadius: "12px" }} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Bar dataKey="Helmet" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Triple Riding" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Wrong Direction" fill="#0071e3" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TRAFFIC OFFICER DASHBOARD VIEW */}
      {role === "TRAFFIC_OFFICER" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel-static p-8">
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Traffic Offence Camera Console</h3>
              <p className="text-[var(--text-secondary)] text-sm mb-6">
                Upload traffic security captures (images/videos). RoadPay AI will process evidence, run OCR plate extraction, resolve ownership registry, and auto-dispatch digital challans.
              </p>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  uploading
                    ? "border-rose-500 bg-rose-500/[0.04] pointer-events-none"
                    : "border-[var(--border-color)] hover:border-rose-500 bg-[var(--hover-bg)] hover:bg-[var(--border-color)]"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,video/*"
                  className="hidden"
                />

                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader className="w-10 h-10 text-rose-500 animate-spin" />
                    <span className="text-sm font-semibold text-rose-500">YOLO Model scanning & plate OCR in progress...</span>
                    <span className="text-xs text-[var(--text-secondary)]">Gemini 3.5 Flash is analyzing evidence file</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <UploadCloud className="w-12 h-12 text-[var(--text-secondary)]" />
                    <span className="text-sm font-semibold text-[var(--text-primary)]">Select traffic capture evidence</span>
                    <span className="text-xs text-[var(--text-tertiary)]">Supports PNG, JPG, JPEG, MP4 files</span>
                  </div>
                )}
              </div>

              {/* Upload Result details */}
              {uploadResult && (
                <div className="mt-8 border-t border-[var(--border-color)] pt-6 animate-fade-in space-y-6">
                  {uploadResult.violation_detected ? (
                    <>
                      <div className="p-4 bg-rose-500/[0.06] border border-rose-500/10 text-rose-700 dark:text-rose-300 rounded-xl flex items-start gap-3 text-sm">
                        <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
                        <div>
                          <strong className="block mb-1">Traffic Infraction Detected!</strong>
                          <span>
                            Violation of type <strong>{uploadResult.violation.violation_type.replace("_", " ")}</strong> (confidence: {Math.round(uploadResult.violation.confidence_score * 100)}%) has been compiled.
                          </span>
                        </div>
                      </div>

                      {/* Evidence Preview and details layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                        {/* Evidence image preview card */}
                        <div className="border border-[var(--border-color)] rounded-xl overflow-hidden aspect-video relative bg-[var(--background)]">
                          {uploadResult.violation.violation_image_path ? (
                            <img
                              src={getFileUrl(uploadResult.violation.violation_image_path)}
                              alt="Uploaded Violation Evidence"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-tertiary)] bg-[var(--hover-bg)]">
                              No preview available
                            </div>
                          )}
                          <div className="absolute top-2 left-2 px-2.5 py-0.5 bg-rose-600/90 text-white text-[9px] font-bold uppercase rounded shadow-sm">
                            AI Scan Active
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex flex-col justify-between space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-xl space-y-1">
                              <span className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">OCR PLATE EXTRACTION</span>
                              <div className="text-sm font-bold text-[var(--text-primary)]">{uploadResult.violation.vehicle_number}</div>
                            </div>

                            <div className="p-4 bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-xl space-y-1">
                              <span className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">REGISTRY MAPPING</span>
                              <div className="text-sm font-bold text-[var(--text-primary)]">
                                {uploadResult.owner_resolved ? (
                                  <span className="text-emerald-500">Resolved: {uploadResult.owner_name}</span>
                                ) : (
                                  <span className="text-yellow-500">Vehicle Not Found (Manual Override Required)</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {uploadResult.email_sent && (
                            <div className="p-4 bg-emerald-500/[0.06] border border-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center gap-2.5 text-xs">
                              <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span>E-Challan PDF generated and digital invoice email dispatched to owner successfully.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-[var(--hover-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl flex items-center gap-3 text-sm">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <span>Security scan complete: No traffic violations detected.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel-static p-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Registry Quick Links</h3>
              <div className="space-y-3">
                <Link
                  href="/dashboard/registry"
                  className="w-full p-4 bg-[var(--hover-bg)] border border-[var(--border-color)] hover:border-[var(--card-hover-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-medium">Verify Registries</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
                </Link>
                <Link
                  href="/dashboard/violations"
                  className="w-full p-4 bg-[var(--hover-bg)] border border-[var(--border-color)] hover:border-[var(--card-hover-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    <span className="text-sm font-medium">Review Detections</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VEHICLE OWNER DASHBOARD VIEW */}
      {role === "VEHICLE_OWNER" && ownerStats && (
        <>
          {/* Discount Promo Banner */}
          {ownerStats.pending_count > 0 && (
            <div className="p-6 bg-gradient-to-r from-rose-500/[0.04] to-emerald-500/[0.04] border border-[var(--border-color)] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-[-50%] right-[-10%] w-[200px] h-[200px] bg-emerald-500/10 rounded-full blur-2xl" />
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-500" />
                  <span>Educate & Save on Fine Penalties!</span>
                </h3>
                <p className="text-[var(--text-secondary)] text-sm mt-1 max-w-xl">
                  You have outstanding traffic challans. Enter the safety education program, pass the short quiz modules, and get a discount of up to 20% on your fine amount instantly.
                </p>
              </div>
              <Link
                href="/dashboard/learning"
                className="px-5 py-3 bg-gradient-success text-white font-bold text-sm rounded-xl shadow-lg hover:brightness-110 active:scale-98 transition-all flex items-center gap-2 shrink-0 self-start md:self-auto"
              >
                <BookOpen className="w-4 h-4" />
                <span>Start Learning</span>
              </Link>
            </div>
          )}

          {/* Stats boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="glass-panel-static p-8 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Pending Fine Amount</span>
                  <h3 className="text-3xl md:text-4xl font-black text-rose-500 mt-2">₹{ownerStats.total_pending_amount}</h3>
                  <span className="text-[10px] text-[var(--text-secondary)] mt-1.5 block font-medium">{ownerStats.pending_count} pending challan(s)</span>
                </div>
                <div className="p-3 bg-rose-500/[0.08] border border-rose-500/10 text-rose-500 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="glass-panel-static p-8 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Settled Fine Amount</span>
                  <h3 className="text-3xl md:text-4xl font-black text-emerald-500 mt-2">₹{ownerStats.total_paid_amount}</h3>
                  <span className="text-[10px] text-[var(--text-secondary)] mt-1.5 block font-medium">{ownerStats.paid_count} paid challan(s)</span>
                </div>
                <div className="p-3 bg-emerald-500/[0.08] border border-emerald-500/10 text-emerald-500 rounded-xl">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="glass-panel-static p-8 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">My Registered Vehicles</span>
                  <h3 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] mt-2">{ownerStats.vehicles_count}</h3>
                  <span className="text-[10px] text-[var(--text-secondary)] mt-1.5 block font-medium">Mapped to your email</span>
                </div>
                <div className="p-3 bg-[var(--hover-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-xl">
                  <Car className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="glass-panel-static p-8 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Safety Certificates</span>
                  <h3 className="text-3xl md:text-4xl font-black text-cyan-500 mt-2">{ownerStats.certificates_count}</h3>
                  <span className="text-[10px] text-[var(--text-secondary)] mt-1.5 block font-medium">Earned by scoring 80%+</span>
                </div>
                <div className="p-3 bg-cyan-500/[0.08] border border-cyan-500/10 text-cyan-500 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Gamification Profile details */}
          {ownerStats.gamification && (
            <div className="glass-panel-static p-8">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Citizen Safety Profile</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Level details */}
                <div className="space-y-4 md:border-r border-[var(--border-color)] md:pr-10">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider">Total Experience</span>
                      <h4 className="text-2xl font-black text-[var(--text-primary)] mt-1">{ownerStats.gamification.xp} XP</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider">Driver Level</span>
                      <h4 className="text-2xl font-black text-rose-500 mt-1">Level {ownerStats.gamification.level}</h4>
                    </div>
                  </div>

                  <div className="w-full h-3 bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                      style={{ width: `${ownerStats.gamification.progress_percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] block">
                    Need <strong>{ownerStats.gamification.next_level_xp} XP</strong> to reach level {ownerStats.gamification.level + 1}
                  </span>
                </div>

                {/* Badges details */}
                <div>
                  <span className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider block mb-4">Safety Achievements Earned</span>
                  <div className="flex flex-wrap gap-4">
                    {ownerStats.gamification.badges && ownerStats.gamification.badges.length > 0 ? (
                      ownerStats.gamification.badges.map((badge: any, index: number) => (
                        <div
                          key={index}
                          className="px-4 py-3 bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-xl flex items-center gap-3.5 transition-all hover:border-[var(--card-hover-border)]"
                          title={badge.description}
                        >
                          <span className="text-2xl">{badge.icon}</span>
                          <div className="text-left leading-none">
                            <span className="text-xs font-bold text-[var(--text-primary)] block mb-0.5">{badge.name}</span>
                            <span className="text-[9px] text-[var(--text-secondary)]">{badge.description}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-[var(--text-secondary)] italic">No badges earned yet. Take your first safety quiz to begin!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* RECENT VIOLATIONS LIST */}
      <div className="glass-panel-static p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Recent Violations Activity</h3>
          <Link
            href="/dashboard/violations"
            className="text-xs font-semibold text-rose-500 hover:text-rose-400 hover:underline flex items-center gap-1.5 transition-all"
          >
            <span>View Full Feed</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentViolations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] font-semibold bg-[var(--hover-bg)]">
                  <th className="py-4 px-5">Challan ID</th>
                  <th className="py-4 px-5">Vehicle</th>
                  <th className="py-4 px-5">Violation Type</th>
                  <th className="py-4 px-5">Date</th>
                  <th className="py-4 px-5 text-right">Fine Amount</th>
                  <th className="py-4 px-5 text-right">Status</th>
                  <th className="py-4 px-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentViolations.map((violation) => (
                  <tr key={violation.id} className="border-b border-[var(--border-color)] table-row-hover text-[var(--text-secondary)]">
                    <td className="py-5 px-5 font-mono font-semibold text-[var(--text-primary)]">{violation.challan_id}</td>
                    <td className="py-5 px-5 font-mono">{violation.vehicle_number}</td>
                    <td className="py-5 px-5">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[var(--background)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                        {violation.violation_type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-5 px-5 text-xs text-[var(--text-secondary)]">
                      {new Date(violation.timestamp).toLocaleString()}
                    </td>
                    <td className="py-5 px-5 text-right font-semibold text-[var(--text-primary)]">₹{violation.final_amount}</td>
                    <td className="py-5 px-5 text-right">
                      <span
                        className={`px-3 py-1 text-[10px] font-bold rounded-full border ${
                          violation.status === "PAID"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            : violation.status === "OVERDUE"
                            ? "bg-rose-500/10 border-rose-500/20 text-rose-500 animate-pulse"
                            : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                        }`}
                      >
                        {violation.status}
                      </span>
                    </td>
                    <td className="py-5 px-5 text-center">
                      <Link
                        href={`/dashboard/violations`}
                        className="p-2 hover:bg-[var(--hover-bg)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-block transition-all"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-[var(--text-tertiary)] italic">No violations recorded.</div>
        )}
      </div>
    </div>
  );
}
