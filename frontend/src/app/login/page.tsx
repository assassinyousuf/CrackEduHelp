"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api.login(email, password);
      
      // Navigate to correct portal
      const role = data.user.role;
      if (role === "admin") router.push("/admin");
      else if (role === "specialist") router.push("/specialist");
      else if (role === "ambassador") router.push("/ambassador");
      else router.push("/student");
      
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl border border-slate-800/80 shadow-2xl space-y-6 hover-tilt">
        
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-white">Welcome Back</h2>
          <p className="text-sm text-slate-400">Sign in to manage your orders or view commissions.</p>
        </div>

        {error && (
          <div className="p-4 bg-rose-950/50 text-rose-200 rounded-lg text-sm flex items-center space-x-2 border border-rose-900/50">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-10 pr-3 py-3 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-10 pr-3 py-3 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-teal-600/10 cursor-pointer"
          >
            <span>{loading ? "Authenticating..." : "Sign In"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-4 border-t border-slate-800/80 text-sm text-slate-450">
          New to CreackEduHelp?{" "}
          <Link href="/register" className="font-bold text-teal-400 hover:underline">
            Create an Account
          </Link>
        </div>

      </div>
    </div>
  );
}
