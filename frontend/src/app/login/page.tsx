"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BrainCircuit,
  Eye,
  EyeOff,
  Loader,
  ShieldAlert,
} from "lucide-react";
import { apiRequest, getToken, saveToken } from "../utils/api";

const demoAccounts = [
  { id: "OWNER", label: "Citizen", email: "owner@roadpay.ai", password: "owner123" },
  { id: "OFFICER", label: "Officer", email: "officer@roadpay.ai", password: "officer123" },
  { id: "ADMIN", label: "Admin", email: "admin@roadpay.ai", password: "admin123" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    if (getToken()) router.push("/dashboard");
  }, [router]);

  const chooseAccount = (role: string) => {
    const account = demoAccounts.find((item) => item.id === role);
    if (!account) return;
    setSelectedRole(role);
    setEmail(account.email);
    setPassword(account.password);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      saveToken(data);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to log in. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell min-h-screen">
      <Link href="/" className="auth-back-link" aria-label="Back to home">
        <ArrowLeft className="w-4 h-4" />
        Home
      </Link>

      <section className="auth-card" aria-labelledby="login-heading">
        <div className="auth-brand-mark">
          <BrainCircuit className="w-8 h-8" />
        </div>

        <header className="auth-heading">
          <h1 id="login-heading">Welcome Back!</h1>
          <p>Please enter your login details.</p>
        </header>

        {error && (
          <div className="auth-error" role="alert">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setSelectedRole("");
              }}
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <div className="auth-password">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setSelectedRole("");
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </label>

          <button type="button" className="auth-forgot">
            Forgot Password?
          </button>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : "Login"}
          </button>
        </form>

        <div className="auth-divider"><span>QUICK ACCESS</span></div>

        <div className="auth-role-grid">
          {demoAccounts.map((account) => (
            <button
              key={account.id}
              type="button"
              onClick={() => chooseAccount(account.id)}
              className={selectedRole === account.id ? "is-active" : ""}
            >
              {account.label}
            </button>
          ))}
        </div>

        <p className="auth-switch">
          Don&apos;t have an account? <Link href="/register">Register now</Link>
        </p>
      </section>
    </main>
  );
}
