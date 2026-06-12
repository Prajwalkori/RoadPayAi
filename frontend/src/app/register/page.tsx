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
import { apiRequest } from "../utils/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          role: "VEHICLE_OWNER",
        }),
      });
      router.push("/login?registered=true");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create your account.");
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

      <section className="auth-card" aria-labelledby="register-heading">
        <div className="auth-brand-mark">
          <BrainCircuit className="w-8 h-8" />
        </div>

        <header className="auth-heading">
          <h1 id="register-heading">Create Account</h1>
          <p>Start your RoadPay safety profile.</p>
        </header>

        {error && (
          <div className="auth-error" role="alert">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Full Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Rahul Sharma"
              autoComplete="name"
              required
            />
          </label>

          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="rahul@example.com"
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
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
                autoComplete="new-password"
                minLength={6}
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

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : "Register"}
          </button>
        </form>

        <div className="auth-divider"><span>OR</span></div>

        <div className="auth-social-grid">
          <button type="button" className="auth-social-btn" id="register-google">
            <span className="social-icon google">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </span>
            With Google
          </button>
          <button type="button" className="auth-social-btn" id="register-facebook">
            <span className="social-icon facebook">f</span>
            With Facebook
          </button>
        </div>

        <div className="auth-divider"><span>ROADPAY AI</span></div>

        <p className="auth-note">
          Citizen accounts can review challans, complete safety modules, earn fine reductions, and pay online.
        </p>

        <p className="auth-switch">
          Already have an account? <Link href="/login">Login now</Link>
        </p>
      </section>
    </main>
  );
}
