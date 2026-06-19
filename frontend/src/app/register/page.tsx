"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { User, Lock, Mail, UserPlus, AlertCircle, ArrowRight, Gift, Phone, GraduationCap, MessageSquare, Camera } from "lucide-react";

// Custom inline SVG for Facebook to bypass Lucide package version mismatches
const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

// Custom inline SVG for LinkedIn to bypass Lucide package version mismatches
const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [university, setUniversity] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [facebookLink, setFacebookLink] = useState("");
  const [linkedinLink, setLinkedinLink] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [role, setRole] = useState<"student" | "ambassador">("student");
  const [refCode, setRefCode] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Read ?ref= parameter from search query
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setRefCode(ref);
    }
  }, [searchParams]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.register({
        email,
        password,
        full_name: fullName,
        role,
        phone,
        university: role === "student" ? university : undefined,
        whatsapp: whatsapp || undefined,
        facebook_link: facebookLink || undefined,
        linkedin_link: linkedinLink || undefined,
        referral_code: refCode || undefined
      }, profilePicture || undefined);

      setSuccess("Account created successfully! Redirecting you to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Check your input fields.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-100 shadow-xl space-y-6">
      
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-slate-900">Create Account</h2>
        <p className="text-sm text-slate-500">Join CreackEduHelp today for academic productivity.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-800 rounded-lg text-sm flex items-center space-x-2 border border-rose-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-sm font-semibold border border-emerald-100">
          {success}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Full Name</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <User className="w-4 h-4" />
            </span>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-3 text-sm focus:outline-none focus:border-teal-500"
              placeholder="e.g. John Doe"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Email Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-3 text-sm focus:outline-none focus:border-teal-500"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Phone Number</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-3 text-sm focus:outline-none focus:border-teal-500"
                placeholder="+44 7946 0958"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">WhatsApp</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <MessageSquare className="w-4 h-4" />
              </span>
              <input
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-3 text-sm focus:outline-none focus:border-teal-500"
                placeholder="WhatsApp Number"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Facebook Profile Link</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Facebook className="w-4 h-4" />
              </span>
              <input
                type="url"
                value={facebookLink}
                onChange={(e) => setFacebookLink(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-3 text-sm focus:outline-none focus:border-teal-500"
                placeholder="facebook.com/..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">LinkedIn Profile Link</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Linkedin className="w-4 h-4" />
              </span>
              <input
                type="url"
                value={linkedinLink}
                onChange={(e) => setLinkedinLink(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-3 text-sm focus:outline-none focus:border-teal-500"
                placeholder="linkedin.com/in/..."
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-3 text-sm focus:outline-none focus:border-teal-500"
              placeholder="Min. 6 characters"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">I want to register as a:</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`py-2 text-xs font-bold rounded-lg border transition ${
                role === "student"
                  ? "bg-teal-600 border-teal-500 text-white"
                  : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              STUDENT
            </button>
            <button
              type="button"
              onClick={() => setRole("ambassador")}
              className={`py-2 text-xs font-bold rounded-lg border transition ${
                role === "ambassador"
                  ? "bg-teal-600 border-teal-500 text-white"
                  : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              AMBASSADOR
            </button>
          </div>
        </div>

        {role === "student" && (
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">University / Institute</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <GraduationCap className="w-4 h-4" />
              </span>
              <input
                type="text"
                required={role === "student"}
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-3 text-sm focus:outline-none focus:border-teal-500"
                placeholder="e.g. Oxford University"
              />
            </div>
          </div>
        )}

        {role === "student" && (
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Referral Code (Optional)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Gift className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-3 text-sm focus:outline-none focus:border-teal-500"
                placeholder="e.g. REF-XXXXXXXX"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Profile Picture (Optional)</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Camera className="w-4 h-4" />
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
              className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-3 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <span>{loading ? "Registering..." : "Create Account"}</span>
          <UserPlus className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center pt-4 border-t border-gray-150 text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-teal-600 hover:underline">
          Sign In
        </Link>
      </div>

    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-slate-500">Loading signup parameters...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
