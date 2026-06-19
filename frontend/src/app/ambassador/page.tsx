"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, AmbassadorStats, User } from "@/lib/api";
import { 
  Users, Gift, Award, DollarSign, MousePointerClick, 
  Link as LinkIcon, CheckCircle, ClipboardCopy 
} from "lucide-react";

export default function AmbassadorDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Stats state
  const [stats, setStats] = useState<AmbassadorStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = api.getCurrentUser();
    if (!user || user.role !== "ambassador") {
      router.push("/login");
    } else {
      setCurrentUser(user);
      loadStats();
    }
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getAmbassadorStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFullReferralUrl = () => {
    if (!stats || stats.referrals.length === 0 && !stats.current_balance) {
      // Temporary fallback or query profile
    }
    const code = stats?.referrals?.[0]?.ambassador?.referral_code || "REF-EDUHELP";
    if (typeof window !== "undefined") {
      return `${window.location.origin}/register?ref=${code}`;
    }
    return `/register?ref=${code}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getFullReferralUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getReferralStatusBadge = (status: string) => {
    switch (status) {
      case "registered": return "bg-gray-100 text-gray-600 border-gray-200";
      case "order_placed": return "bg-blue-50 text-blue-700 border-blue-200";
      case "paid": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500">Loading ambassador insights...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="pb-6 border-b border-gray-200">
        <h1 className="text-2xl font-black text-slate-900">Ambassador Panel</h1>
        <p className="text-sm text-slate-500">Welcome, {currentUser?.full_name}. Promoted student conversions are tracked below in real-time.</p>
      </div>

      {/* Referral Link Manager */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center space-x-2">
            <Gift className="w-5 h-5 text-teal-600" />
            <span>Your Custom Referral Link</span>
          </h3>
          <p className="text-xs text-slate-500">Share this address with students. When they place formatting or slide design tasks, you earn a 10% commission.</p>
        </div>

        <div className="flex w-full md:w-auto bg-slate-50 border border-gray-200 rounded-lg p-2 items-center gap-2 max-w-xl">
          <span className="text-xs text-slate-600 select-all truncate pl-2">{getFullReferralUrl()}</span>
          <button
            onClick={handleCopyLink}
            className="flex items-center space-x-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded transition shrink-0"
          >
            {copied ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <ClipboardCopy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase">Referral Clicks</span>
            <MousePointerClick className="w-5 h-5 text-teal-600" />
          </div>
          <span className="block text-2xl font-black text-slate-900">{stats?.clicks || 0}</span>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase">Sign Ups</span>
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <span className="block text-2xl font-black text-slate-900">{stats?.registrations || 0}</span>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Commission</span>
            <Award className="w-5 h-5 text-teal-600" />
          </div>
          <span className="block text-2xl font-black text-slate-900">£{stats?.total_earnings || "0.00"}</span>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase">Withdrawable Balance</span>
            <DollarSign className="w-5 h-5 text-teal-600" />
          </div>
          <span className="block text-2xl font-black text-emerald-600">£{stats?.current_balance || "0.00"}</span>
        </div>
      </div>

      {/* Referrals table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 overflow-hidden">
        <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wider mb-4">Promoted Lead Tracking Directory</h3>

        {(!stats || stats.referrals.length === 0) ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No registered referrals found. Share your link with students to populate tracking directories.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-slate-400 font-semibold uppercase">
                  <th className="pb-3">Student Name</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">Signup Date</th>
                  <th className="pb-3">Conversion Status</th>
                  <th className="pb-3 text-right">Commission Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-slate-700">
                {stats.referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-slate-50/50">
                    <td className="py-4 font-bold text-gray-900">{ref.referred_user.full_name}</td>
                    <td className="py-4 text-slate-500">{ref.referred_user.email}</td>
                    <td className="py-4 text-slate-500">{new Date(ref.created_at).toLocaleDateString()}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 font-bold uppercase rounded-full border text-[9px] ${getReferralStatusBadge(ref.status)}`}>
                        {ref.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 text-right font-semibold text-gray-900">£{ref.commission_earned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
