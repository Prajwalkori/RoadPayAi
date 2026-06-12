"use client";

import React, { useState, useEffect } from "react";
import {
  Key,
  Mail,
  CreditCard,
  Database,
  Calendar,
  ShieldCheck,
  Loader,
  Play,
  RotateCcw,
  Sparkles
} from "lucide-react";
import { apiRequest } from "../../utils/api";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  
  // Credentials state
  const [geminiKey, setGeminiKey] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpUsername, setSmtpUsername] = useState("");
  const [razorpayKey, setRazorpayKey] = useState("");

  // Testing status
  const [smtpTestStatus, setSmtpTestStatus] = useState<"idle" | "testing" | "passed" | "failed">("idle");
  const [geminiTestStatus, setGeminiTestStatus] = useState<"idle" | "testing" | "passed" | "failed">("idle");
  const [razorpayTestStatus, setRazorpayTestStatus] = useState<"idle" | "testing" | "passed" | "failed">("idle");

  // Time-warp state
  const [warpDays, setWarpDays] = useState(3);
  const [warping, setWarping] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/settings");
      setGeminiKey(res.gemini_api_key || "");
      setSmtpHost(res.smtp_host || "");
      setSmtpUsername(res.smtp_username || "");
      setRazorpayKey(res.razorpay_key_id || "");
    } catch (e) {
      console.log("Error loading settings:", e);
    } finally {
      setLoading(false);
    }
  };

  const testSmtpConn = async () => {
    setSmtpTestStatus("testing");
    try {
      await apiRequest("/settings/test-smtp", { method: "POST" });
      setSmtpTestStatus("passed");
    } catch {
      setSmtpTestStatus("failed");
    }
  };

  const testGeminiConn = async () => {
    setGeminiTestStatus("testing");
    try {
      await apiRequest("/settings/test-gemini", { method: "POST" });
      setGeminiTestStatus("passed");
    } catch {
      setGeminiTestStatus("failed");
    }
  };

  const testRazorpayConn = async () => {
    setRazorpayTestStatus("testing");
    try {
      await apiRequest("/settings/test-razorpay", { method: "POST" });
      setRazorpayTestStatus("passed");
    } catch {
      setRazorpayTestStatus("failed");
    }
  };

  const runAllDiagnostics = () => {
    testGeminiConn();
    testSmtpConn();
    testRazorpayConn();
  };

  useEffect(() => {
    const init = async () => {
      await loadSettings();
      testGeminiConn();
      testSmtpConn();
      testRazorpayConn();
    };
    init();
  }, []);

  const triggerMockSeeder = async () => {
    setSeeding(true);
    try {
      const res = await apiRequest("/settings/seed-mock-data", { method: "POST" });
      alert(res.message || "Mock vehicle registry database seeded!");
    } catch (err: any) {
      alert(err.message || "Seeding failed.");
    } finally {
      setSeeding(false);
    }
  };

  const triggerTimeWarp = async () => {
    setWarping(true);
    try {
      const formData = new FormData();
      formData.append("days", warpDays.toString());
      const res = await apiRequest("/violations/simulate-days", {
        method: "POST",
        body: formData
      });
      alert(`Warp complete! ${res.message}. Penalties calculated: ${res.penalties_updated_count} records affected.`);
    } catch (err: any) {
      alert(err.message || "Time-warp simulation failed.");
    } finally {
      setWarping(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center text-[var(--text-secondary)]">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-[var(--primary)] animate-spin" />
          <span>Syncing configuration settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Onboarding Wizard / Forms */}
      <div className="lg:col-span-2 space-y-8">
        <div className="glass-panel-static p-6">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Secure Integrations Console</h2>
              <p className="text-[var(--text-secondary)] text-xs mt-1">
                API credentials are read-only and loaded securely from the backend environment configuration file (`.env`).
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Gemini AI Status */}
            <div className="p-4 bg-[var(--background)] border border-[var(--border-color)] rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-rose-500/10 text-[var(--primary)] rounded-xl shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[var(--text-primary)]">Google Gemini AI Engine</h4>
                  <p className="text-[var(--text-secondary)] text-xs mt-0.5">
                    Powers violation detection, OCR verification, quiz generation, and email drafting using Gemini 3.5 Flash.
                  </p>
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)] block mt-1">
                    Key Configured: {geminiKey ? `••••${geminiKey.slice(-4)}` : "None"}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  geminiTestStatus === "passed"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : geminiTestStatus === "failed"
                    ? "bg-rose-500/10 text-rose-500"
                    : geminiTestStatus === "testing"
                    ? "bg-blue-500/10 text-blue-500"
                    : "bg-[var(--border-color)] text-[var(--text-secondary)]"
                }`}>
                  {geminiTestStatus === "passed" && (
                    <>
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span>Active & Reachable</span>
                    </>
                  )}
                  {geminiTestStatus === "failed" && (
                    <>
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      <span>Verification Failed</span>
                    </>
                  )}
                  {geminiTestStatus === "testing" && (
                    <>
                      <Loader className="w-3 h-3 animate-spin text-[var(--primary)]" />
                      <span>Testing...</span>
                    </>
                  )}
                  {geminiTestStatus === "idle" && (
                    <>
                      <span className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full" />
                      <span>Unverified</span>
                    </>
                  )}
                </span>
                <button
                  onClick={testGeminiConn}
                  disabled={geminiTestStatus === "testing"}
                  className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border-color)] hover:border-[var(--text-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 text-[11px] font-bold rounded-xl transition-all"
                >
                  Verify
                </button>
              </div>
            </div>

            {/* SMTP Mail Gateway Status */}
            <div className="p-4 bg-[var(--background)] border border-[var(--border-color)] rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-cyan-500/10 text-cyan-500 rounded-xl shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[var(--text-primary)]">SMTP Mail Gateway</h4>
                  <p className="text-[var(--text-secondary)] text-xs mt-0.5">
                    Dispatches safety notifications, fine alerts and certificates.
                  </p>
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)] block mt-1">
                    Host: {smtpHost || "None"} | Sender: {smtpUsername || "None"}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  smtpTestStatus === "passed"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : smtpTestStatus === "failed"
                    ? "bg-rose-500/10 text-rose-500"
                    : smtpTestStatus === "testing"
                    ? "bg-blue-500/10 text-blue-500"
                    : "bg-[var(--border-color)] text-[var(--text-secondary)]"
                }`}>
                  {smtpTestStatus === "passed" && (
                    <>
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span>Authenticated</span>
                    </>
                  )}
                  {smtpTestStatus === "failed" && (
                    <>
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      <span>Verification Failed</span>
                    </>
                  )}
                  {smtpTestStatus === "testing" && (
                    <>
                      <Loader className="w-3 h-3 animate-spin text-[var(--primary)]" />
                      <span>Testing...</span>
                    </>
                  )}
                  {smtpTestStatus === "idle" && (
                    <>
                      <span className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full" />
                      <span>Unverified</span>
                    </>
                  )}
                </span>
                <button
                  onClick={testSmtpConn}
                  disabled={smtpTestStatus === "testing"}
                  className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border-color)] hover:border-[var(--text-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 text-[11px] font-bold rounded-xl transition-all"
                >
                  Verify
                </button>
              </div>
            </div>

            {/* Razorpay Gateway Status */}
            <div className="p-4 bg-[var(--background)] border border-[var(--border-color)] rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[var(--text-primary)]">Razorpay Payment Gateway</h4>
                  <p className="text-[var(--text-secondary)] text-xs mt-0.5">
                    Settles digital penalty fines via secure Razorpay checkout order flows.
                  </p>
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)] block mt-1">
                    Merchant Key: {razorpayKey || "None"}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  razorpayTestStatus === "passed"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : razorpayTestStatus === "failed"
                    ? "bg-rose-500/10 text-rose-500"
                    : razorpayTestStatus === "testing"
                    ? "bg-blue-500/10 text-blue-500"
                    : "bg-[var(--border-color)] text-[var(--text-secondary)]"
                }`}>
                  {razorpayTestStatus === "passed" && (
                    <>
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span>Active (Test Mode)</span>
                    </>
                  )}
                  {razorpayTestStatus === "failed" && (
                    <>
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      <span>Verification Failed</span>
                    </>
                  )}
                  {razorpayTestStatus === "testing" && (
                    <>
                      <Loader className="w-3 h-3 animate-spin text-[var(--primary)]" />
                      <span>Testing...</span>
                    </>
                  )}
                  {razorpayTestStatus === "idle" && (
                    <>
                      <span className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full" />
                      <span>Unverified</span>
                    </>
                  )}
                </span>
                <button
                  onClick={testRazorpayConn}
                  disabled={razorpayTestStatus === "testing"}
                  className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border-color)] hover:border-[var(--text-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 text-[11px] font-bold rounded-xl transition-all"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={runAllDiagnostics}
              disabled={
                geminiTestStatus === "testing" ||
                smtpTestStatus === "testing" ||
                razorpayTestStatus === "testing"
              }
              className="px-5 py-2.5 bg-gradient-primary text-white font-bold text-xs rounded-xl shadow-lg hover:brightness-110 active:scale-98 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Run System Diagnostics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simulator Sidebars */}
      <div className="space-y-8">
        {/* Seeder Box */}
        <div className="glass-panel-static p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <Database className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Registry Mock Seeder</h3>
          </div>
          <p className="text-[var(--text-secondary)] text-xs leading-relaxed mb-6">
            Instantly preload the database with registered vehicle records, user accounts (including the default <strong>owner@roadpay.ai / owner123</strong> profile), and simulated violations in various states.
          </p>
          <button
            onClick={triggerMockSeeder}
            disabled={seeding}
            className="w-full py-3 bg-gradient-success text-white font-bold text-xs rounded-xl shadow-lg hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {seeding ? (
              <Loader className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Seed Mock Registry</span>
              </>
            )}
          </button>
        </div>

        {/* Time Warp Box */}
        <div className="glass-panel-static p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <Calendar className="w-5 h-5 text-cyan-500" />
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Penalty Time-Warp</h3>
          </div>
          <p className="text-[var(--text-secondary)] text-xs leading-relaxed mb-6">
            Artificially advance the timestamp of all pending violations. This triggers automatic fine escalation increments:
            <span className="block mt-2 font-mono text-[10px] text-[var(--text-tertiary)]">
              - 3 Days: ₹500 → ₹600 (Reminder 2 sent)<br />
              - 7 Days: ₹600 → ₹800 (Reminder 3 sent)<br />
              - 15 Days: ₹800 → ₹1000 (Overdue status applied)
            </span>
          </p>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-2">Advance System Time (Days)</label>
              <div className="flex items-center justify-between gap-4">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={warpDays}
                  onChange={(e) => setWarpDays(parseInt(e.target.value))}
                  className="flex-1 accent-[var(--primary)] bg-[var(--background)] h-2 rounded-lg cursor-pointer"
                />
                <span className="font-bold text-[var(--text-primary)] text-sm bg-[var(--background)] border border-[var(--border-color)] px-3 py-1 rounded-lg shrink-0 select-none">
                  {warpDays} Days
                </span>
              </div>
            </div>

            <button
              onClick={triggerTimeWarp}
              disabled={warping}
              className="w-full py-3 bg-gradient-cyber text-white font-bold text-xs rounded-xl shadow-lg hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {warping ? (
                <Loader className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Advance Simulation Days</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
