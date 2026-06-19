"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api, AdminStats, Order, Payment, User, ChatMessage } from "@/lib/api";
import { 
  FileText, CheckCircle2, AlertCircle, DollarSign, Users, 
  Layers, Settings, Award, CheckSquare, XCircle, Send, MessageSquare, Download,
  Search, TrendingUp, Activity, ShieldCheck, RefreshCw
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Admin states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [specialists, setSpecialists] = useState<User[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Search filters
  const [orderSearch, setOrderSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");

  // Admin interactive forms
  const [overrideQuoteInput, setOverrideQuoteInput] = useState("");
  const [selectedSpecialistId, setSelectedSpecialistId] = useState("");
  const [activeTab, setActiveTab] = useState<"stats" | "orders" | "payments" | "users">("stats");

  // Chat window state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Form notifications
  const [actionErr, setActionErr] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Loading state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = api.getCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/login");
    } else {
      setCurrentUser(user);
      loadAdminData();
    }
  }, []);

  // Poll Chat Messages if an order is active in admin panel
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (selectedOrder) {
      loadChat(selectedOrder.id);
      interval = setInterval(() => {
        loadChat(selectedOrder.id);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [selectedOrder]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const statsData = await api.getAdminStats();
      setStats(statsData);

      const ordersData = await api.getOrders();
      setOrders(ordersData);
      if (ordersData.length > 0 && !selectedOrder) {
        setSelectedOrder(ordersData[0]);
      }

      const paymentsData = await api.getPayments();
      setPayments(paymentsData);

      const specsData = await api.getSpecialists();
      setSpecialists(specsData);
      if (specsData.length > 0) {
        setSelectedSpecialistId(specsData[0].id);
      }

      const uList = await api.getUsers();
      setUsersList(uList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadChat = async (orderId: string) => {
    try {
      const msgs = await api.getMessages(orderId);
      setChatMessages(msgs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !newMessage.trim()) return;

    try {
      const msg = await api.sendMessage(selectedOrder.id, newMessage);
      setChatMessages([...chatMessages, msg]);
      setNewMessage("");
    } catch (err) {
      console.error(err);
    }
  };

  // Override quote values
  const handleOverrideQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionErr("");
    setActionSuccess("");

    if (!selectedOrder || !overrideQuoteInput) return;

    try {
      const updated = await api.overrideQuote(selectedOrder.id, Number(overrideQuoteInput));
      setActionSuccess("Quote overrode successfully!");
      setOverrideQuoteInput("");
      loadAdminData();
      setSelectedOrder(updated);
    } catch (err: any) {
      setActionErr("Failed to override quote: " + err.message);
    }
  };

  // Assign specialist to task
  const handleAssignSpecialist = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionErr("");
    setActionSuccess("");

    if (!selectedOrder || !selectedSpecialistId) return;

    try {
      const updated = await api.assignSpecialist(selectedOrder.id, selectedSpecialistId);
      setActionSuccess("Specialist assigned successfully!");
      loadAdminData();
      setSelectedOrder(updated);
    } catch (err: any) {
      setActionErr("Failed to assign specialist: " + err.message);
    }
  };

  // Verify deposit or final payments
  const handleVerifyPayment = async (paymentId: string, status: "approved" | "rejected") => {
    setActionErr("");
    setActionSuccess("");

    try {
      await api.verifyPayment(paymentId, status);
      setActionSuccess(`Payment status changed to ${status}!`);
      loadAdminData();
    } catch (err: any) {
      setActionErr("Failed to verify payment: " + err.message);
    }
  };

  // Filtered lists
  const filteredOrders = useMemo(() => {
    if (!orderSearch.trim()) return orders;
    const s = orderSearch.toLowerCase();
    return orders.filter(
      (o) =>
        o.title.toLowerCase().includes(s) ||
        o.id.toLowerCase().includes(s) ||
        o.service_type.toLowerCase().includes(s) ||
        (o.student?.full_name || "").toLowerCase().includes(s)
    );
  }, [orders, orderSearch]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return usersList;
    const s = userSearch.toLowerCase();
    return usersList.filter(
      (u) =>
        u.full_name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        u.role.toLowerCase().includes(s)
    );
  }, [usersList, userSearch]);

  const filteredPayments = useMemo(() => {
    const pending = payments.filter((p) => p.status === "pending");
    if (!paymentSearch.trim()) return pending;
    const s = paymentSearch.toLowerCase();
    return pending.filter(
      (p) =>
        p.order_id.toLowerCase().includes(s) ||
        p.payment_type.toLowerCase().includes(s) ||
        p.payment_method.toLowerCase().includes(s)
    );
  }, [payments, paymentSearch]);

  // Order status statistics
  const orderStats = useMemo(() => {
    const statsObj = { completed: 0, inProgress: 0, reviewing: 0, total: orders.length };
    orders.forEach((o) => {
      if (o.status === "completed") {
        statsObj.completed += 1;
      } else if (
        ["in_progress", "assigned", "draft_submitted", "final_review", "deposit_paid"].includes(o.status)
      ) {
        statsObj.inProgress += 1;
      } else {
        statsObj.reviewing += 1;
      }
    });
    return statsObj;
  }, [orders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "bg-slate-900/40 text-slate-400 border-slate-800";
      case "under_review": return "bg-amber-955/40 text-amber-400 border-amber-900/60";
      case "quoted": return "bg-blue-950/40 text-blue-400 border-blue-900/60";
      case "deposit_paid": return "bg-teal-955/40 text-teal-400 border-teal-900/60";
      case "assigned": return "bg-cyan-950/40 text-cyan-400 border-cyan-900/60";
      case "in_progress": return "bg-indigo-950/40 text-indigo-400 border-indigo-900/60";
      case "completed": return "bg-emerald-950/40 text-emerald-400 border-emerald-900/60";
      case "cancelled": return "bg-rose-955/40 text-rose-455 border-rose-900/60";
      default: return "bg-slate-900/40 text-slate-400 border-slate-800";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100 relative">
      
      {/* Header section with Cybernetic Switchboard navigation */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-6 border-b border-slate-800 gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse"></span>
            <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">CreackEduHelp Operations</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">Admin Command Center</h1>
          <p className="text-xs text-slate-400">Welcome back, {currentUser?.full_name}. Real-time statistics and administrative auditing console.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-900/80 rounded-xl border border-slate-800 p-1 shadow-2xl backdrop-blur-md">
            {[
              { id: "stats", label: "KPI Monitor" },
              { id: "orders", label: "Order Desk" },
              { id: "payments", label: "Escrow Audits" },
              { id: "users", label: "User Directory" }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center space-x-1.5 ${
                  activeTab === t.id 
                    ? "bg-teal-600 text-white shadow-lg shadow-teal-500/20" 
                    : "text-slate-400 hover:text-teal-400"
                }`}
              >
                <span className={`w-1 h-1 rounded-full ${activeTab === t.id ? "bg-white" : "bg-transparent"}`}></span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={loadAdminData}
            className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl hover:bg-slate-850 transition-all flex items-center space-x-1.5 shadow-md"
            title="Reload operations logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-950/40 text-emerald-400 rounded-xl text-sm font-semibold border border-emerald-900/60 shadow-lg flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionErr && (
        <div className="p-4 bg-rose-955/40 text-rose-455 rounded-xl text-sm font-semibold border border-rose-900/60 shadow-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <span>{actionErr}</span>
        </div>
      )}

      {/* ==========================================
          TAB 1: STATS KPI MONITOR
          ========================================== */}
      {activeTab === "stats" && stats && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-2xl space-y-2 backdrop-blur-md hover-tilt relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-indigo-500 opacity-50"></div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Active Orders</span>
                <Layers className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="block text-3xl font-black text-white">{stats.total_orders}</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-2xl space-y-2 backdrop-blur-md hover-tilt relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-rose-500 opacity-50"></div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Quotes</span>
                <AlertCircle className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="block text-3xl font-black text-white">{stats.pending_orders}</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-2xl space-y-2 backdrop-blur-md hover-tilt relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-50"></div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Escrow Revenue</span>
                <DollarSign className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="block text-3xl font-black text-emerald-450">£{stats.total_revenue}</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-2xl space-y-2 backdrop-blur-md hover-tilt relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-50"></div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Affiliate Liability</span>
                <Award className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="block text-3xl font-black text-indigo-400">£{stats.referral_payout_liability}</span>
            </div>
          </div>

          {/* Premium Analytics Graphs / Real-Time distributions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Order status tracking rings/bars */}
            <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-2xl space-y-6 backdrop-blur-md">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">Workflow Allocations</h3>
                  <p className="text-[10px] text-slate-500">Breakdown of orders inside the operations queue</p>
                </div>
                <Activity className="w-4 h-4 text-teal-400" />
              </div>

              {/* Progress bars styling */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-emerald-400 flex items-center space-x-1">
                      <span>Completed Milestone Drafts</span>
                    </span>
                    <span>{orderStats.completed} / {orderStats.total} ({orderStats.total > 0 ? Math.round((orderStats.completed / orderStats.total) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-md shadow-emerald-500/20" 
                      style={{ width: `${orderStats.total > 0 ? (orderStats.completed / orderStats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-indigo-400">In Active Production (Assigned / Revisions)</span>
                    <span>{orderStats.inProgress} / {orderStats.total} ({orderStats.total > 0 ? Math.round((orderStats.inProgress / orderStats.total) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500 shadow-md shadow-indigo-500/20" 
                      style={{ width: `${orderStats.total > 0 ? (orderStats.inProgress / orderStats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-amber-400">Review & Initial Assessment</span>
                    <span>{orderStats.reviewing} / {orderStats.total} ({orderStats.total > 0 ? Math.round((orderStats.reviewing / orderStats.total) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500 shadow-md shadow-amber-500/20" 
                      style={{ width: `${orderStats.total > 0 ? (orderStats.reviewing / orderStats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Auditing Live logs and alerts */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-2xl space-y-4 backdrop-blur-md">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="font-extrabold text-sm text-slate-500 uppercase tracking-wider">Live System Monitors</h3>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
              </div>
              
              <div className="space-y-4 pt-2 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-slate-950/60 border border-slate-850 rounded-xl">
                  <span className="text-slate-400 font-medium">Unassigned Specialists</span>
                  <span className="font-black text-white">{specialists.length}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-950/60 border border-slate-850 rounded-xl">
                  <span className="text-slate-400 font-medium">Total Registered Users</span>
                  <span className="font-black text-white">{usersList.length}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-950/60 border border-slate-850 rounded-xl">
                  <span className="text-slate-400 font-medium">Awaiting Escrow Approvals</span>
                  <span className="font-black text-amber-400">{payments.filter(p => p.status === "pending").length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: ORDERS MANAGEMENT
          ========================================== */}
      {activeTab === "orders" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          
          {/* Order selection list side panel */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-2xl h-fit space-y-4 backdrop-blur-md">
            <div className="px-2 space-y-3">
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">Order Desk Queue</h3>
              
              {/* Search box */}
              <div className="relative">
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search title, ID, university..."
                  className="w-full border border-slate-800 bg-slate-950/80 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 placeholder-slate-600 transition-all"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-500">No projects match the query.</p>
            ) : (
              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {filteredOrders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex flex-col space-y-2 relative overflow-hidden group ${
                      selectedOrder?.id === o.id 
                        ? "bg-teal-955/40 border-teal-800/80 shadow-lg shadow-teal-950/10" 
                        : "bg-slate-955/60 border-transparent hover:bg-slate-900/40 hover:border-slate-850"
                    }`}
                  >
                    {selectedOrder?.id === o.id && (
                      <div className="absolute top-0 bottom-0 left-0 w-1 bg-teal-500"></div>
                    )}
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-white truncate max-w-[150px]">{o.title}</span>
                      <span className={`text-[9px] px-2 py-0.5 font-bold uppercase rounded-full border shrink-0 ${getStatusColor(o.status)}`}>
                        {o.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span className="truncate max-w-[120px]">{o.service_type}</span>
                      <span className="font-bold text-teal-400">£{o.quote_amount || "Unquoted"}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Configuration details desk */}
          {selectedOrder ? (
            <div className="lg:col-span-2 space-y-6">
              
              {/* Order spec panel */}
              <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-2xl space-y-6 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row justify-between items-start pb-4 border-b border-slate-800 gap-2">
                  <div>
                    <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-widest">Order ID: #{selectedOrder.id.slice(-8).toUpperCase()}</span>
                    <h2 className="text-xl font-bold text-white mt-0.5">{selectedOrder.title}</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Student: <strong className="text-slate-200">{selectedOrder.student?.full_name}</strong> ({selectedOrder.student?.email})
                    </p>
                  </div>
                  <span className={`px-3 py-1 font-bold text-xs uppercase rounded-full border h-fit ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status.replace("_", " ")}
                  </span>
                </div>

                {/* Milestone progress tracker */}
                <div className="py-2">
                  <span className="block text-xs font-semibold uppercase text-slate-500 mb-4">Escrow Lifecycle Roadmap</span>
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-850 -translate-y-1/2 z-0"></div>
                    {["submitted", "deposit_paid", "in_progress", "final_review", "completed"].map((st, idx) => {
                      const stages = ["submitted", "under_review", "quoted", "deposit_paid", "assigned", "in_progress", "draft_submitted", "revision_requested", "final_review", "completed"];
                      const currentIdx = stages.indexOf(selectedOrder.status);
                      const stageIdx = stages.indexOf(st);
                      const isActive = currentIdx >= stageIdx && selectedOrder.status !== "cancelled";
                      return (
                        <div key={st} className="flex flex-col items-center z-10">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
                            isActive 
                              ? "bg-teal-600 border-teal-500 text-white shadow-md shadow-teal-500/20 scale-110" 
                              : "bg-slate-950 border-slate-850 text-slate-500"
                          }`}>
                            {isActive ? "✓" : idx + 1}
                          </span>
                          <span className="text-[9px] font-bold uppercase mt-2 text-slate-400 bg-[#0a1022] px-1.5 py-0.5 rounded border border-slate-850/60">
                            {st.replace("_", " ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-4 border-t border-slate-800">
                  <div>
                    <span className="text-slate-500 block uppercase font-semibold text-[10px]">Service Type</span>
                    <span className="font-bold text-slate-200">{selectedOrder.service_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-semibold text-[10px]">Deadline Date</span>
                    <span className="font-bold text-slate-200">{new Date(selectedOrder.deadline).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-semibold text-[10px]">Current Quote</span>
                    <span className="font-bold text-teal-400">£{selectedOrder.quote_amount || "Pending"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-semibold text-[10px]">Specialist Partner</span>
                    <span className="font-bold text-indigo-400">
                      {selectedOrder.specialist?.full_name || "Unassigned"}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-955/60 border border-slate-800/80 p-4 rounded-xl text-xs space-y-1.5">
                  <span className="font-bold text-slate-400 block border-b border-slate-850 pb-1.5">Task Description Instructions:</span>
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{selectedOrder.task_description}</p>
                </div>

                {/* Guidelines download list */}
                {selectedOrder.files.length > 0 && (
                  <div className="space-y-2.5">
                    <span className="text-xs font-semibold text-slate-550 uppercase block">Guideline Documents</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedOrder.files.map((file) => (
                        <div key={file.id} className="p-3 border border-slate-800 rounded-xl flex items-center justify-between text-xs bg-slate-955/40 hover:border-slate-700 transition">
                          <div className="flex items-center space-x-2 truncate">
                            <FileText className="w-4 h-4 text-teal-400 shrink-0" />
                            <span className="font-bold text-slate-300 truncate mr-2" title={file.file_name}>
                              {file.file_name}
                            </span>
                          </div>
                          <a
                            href={api.getDownloadUrl(file.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-teal-450 hover:text-teal-450 hover:bg-teal-950/40 rounded-lg transition"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Control Console Form panel */}
              <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-2xl space-y-4 backdrop-blur-md">
                <h3 className="font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
                  <Settings className="w-5 h-5 text-teal-450" />
                  <span>Administrative Control Console</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  
                  {/* Quote Override form */}
                  <form onSubmit={handleOverrideQuote} className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Override Quote Price (£)</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" required value={overrideQuoteInput} onChange={(e) => setOverrideQuoteInput(e.target.value)}
                        className="border border-slate-850 bg-slate-955/80 text-white rounded-lg p-2.5 text-xs flex-grow focus:outline-none focus:border-teal-500 placeholder-slate-650"
                        placeholder="e.g. 150.00"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg transition shrink-0 shadow-lg shadow-teal-500/20"
                      >
                        Override
                      </button>
                    </div>
                  </form>

                  {/* Specialist assignment dropdown */}
                  <form onSubmit={handleAssignSpecialist} className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Assign Specialist Partner</label>
                    <div className="flex gap-2">
                      <select 
                        value={selectedSpecialistId} onChange={(e) => setSelectedSpecialistId(e.target.value)}
                        className="border border-slate-850 bg-slate-955/80 text-white rounded-lg p-2.5 text-xs flex-grow focus:outline-none focus:border-teal-500"
                      >
                        {specialists.map((s) => (
                          <option className="bg-slate-850 text-white" key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg transition shrink-0 shadow-lg shadow-teal-500/20"
                      >
                        Assign
                      </button>
                    </div>
                  </form>

                </div>
              </div>

              {/* Chat panel */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-2xl space-y-4 backdrop-blur-md">
                <h3 className="font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
                  <MessageSquare className="w-5 h-5 text-teal-450" />
                  <span>Discussion Feeds (Join Thread)</span>
                </h3>

                <div className="h-64 overflow-y-auto border border-slate-800 rounded-xl p-4 bg-slate-955/60 space-y-3 flex flex-col">
                  {chatMessages.length === 0 ? (
                    <div className="text-center my-auto text-slate-500 text-xs">
                      No discussion logs. Start the thread as admin to connect with the student.
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.sender_id === currentUser?.id;
                      return (
                        <div 
                          key={msg.id} 
                          className={`max-w-[70%] p-3 rounded-xl text-xs space-y-1 ${
                            isMe 
                              ? "bg-teal-600 text-white self-end rounded-tr-none" 
                              : "bg-slate-900 text-slate-200 border border-slate-800 self-start rounded-tl-none shadow-sm"
                          }`}
                        >
                          <span className="block font-bold text-[9px] opacity-75">
                            {msg.sender.full_name} ({msg.sender.role})
                          </span>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.message_text}</p>
                          <span className="block text-[8px] text-right opacity-60">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text" required value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-grow border border-slate-800 bg-slate-955/60 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-teal-500 placeholder-slate-500"
                    placeholder="Provide customer support updates or review deliverables..."
                  />
                  <button
                    type="submit"
                    className="p-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition shadow-lg shadow-teal-500/20"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>

            </div>
          ) : (
            <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 p-12 rounded-2xl shadow-2xl text-center backdrop-blur-md flex flex-col items-center justify-center space-y-2">
              <Layers className="w-8 h-8 text-slate-600" />
              <p className="text-slate-400 text-sm">Select an active project from the list to manage parameters.</p>
            </div>
          )}

        </div>
      )}

      {/* ==========================================
          TAB 3: PAYMENT PROOF AUDITING
          ========================================== */}
      {activeTab === "payments" && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl shadow-2xl p-6 overflow-hidden backdrop-blur-md animate-fadeIn space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">Pending Payments Queue</h3>
              <p className="text-[10px] text-slate-500">Verify manual transfers for quoted deposit and final stages</p>
            </div>
            
            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                placeholder="Filter by Order ID..."
                className="w-full border border-slate-800 bg-slate-950/80 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 placeholder-slate-600"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <p className="text-center py-12 text-slate-500 text-xs">No pending manual payment receipts awaiting verification.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-500 font-semibold uppercase">
                    <th className="pb-3 pl-2">Order ID</th>
                    <th className="pb-3">Student ID</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Method</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Receipt Document</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 text-slate-300">
                  {filteredPayments.map((p) => {
                    const isWise = p.payment_method === "wise";
                    const isPayPal = p.payment_method === "paypal";
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 pl-2 font-bold text-white">#{p.order_id.slice(-8).toUpperCase()}</td>
                        <td className="py-4 text-slate-400">{p.student_id.slice(-8)}</td>
                        <td className="py-4 capitalize font-semibold">{p.payment_type}</td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            isWise ? "bg-teal-950/40 text-teal-400 border-teal-900/60" :
                            isPayPal ? "bg-blue-950/40 text-blue-400 border-blue-900/60" :
                            "bg-emerald-950/40 text-emerald-400 border-emerald-900/60"
                          }`}>
                            {p.payment_method.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-4 font-bold text-teal-400">£{p.amount}</td>
                        <td className="py-4">
                          <a 
                            href={api.getDownloadUrl(p.id)}  
                            target="_blank" rel="noreferrer"
                            className="text-teal-450 hover:text-teal-400 font-bold hover:underline"
                          >
                            View Receipt Proof
                          </a>
                        </td>
                        <td className="py-4 text-right pr-2 flex justify-end space-x-1.5">
                          <button
                            onClick={() => handleVerifyPayment(p.id, "approved")}
                            className="p-1.5 text-emerald-450 hover:bg-emerald-950/40 border border-transparent hover:border-emerald-900/40 rounded-lg transition"
                            title="Verify deposit payment"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleVerifyPayment(p.id, "rejected")}
                            className="p-1.5 text-rose-450 hover:bg-rose-955/40 border border-transparent hover:border-rose-900/40 rounded-lg transition"
                            title="Reject deposit payment"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 4: USER DIRECTORY
          ========================================== */}
      {activeTab === "users" && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl shadow-2xl p-6 overflow-hidden backdrop-blur-md animate-fadeIn space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">User Directories</h3>
              <p className="text-[10px] text-slate-500">Directory of registered student clients, ambassadors, and specialists</p>
            </div>
            
            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Filter by name, email, or role..."
                className="w-full border border-slate-800 bg-slate-950/80 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 placeholder-slate-650"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-500 font-semibold uppercase">
                  <th className="pb-3 pl-2">Name Profile</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">User Role</th>
                  <th className="pb-3">Active Status</th>
                  <th className="pb-3 text-right pr-2">Account Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-slate-300">
                {filteredUsers.map((user) => {
                  const initials = user.full_name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  const avatarBg = 
                    user.role === "admin" ? "bg-rose-900/50 text-rose-350 border-rose-800/80" : 
                    user.role === "specialist" ? "bg-indigo-900/50 text-indigo-350 border-indigo-800/80" : 
                    user.role === "ambassador" ? "bg-amber-900/50 text-amber-350 border-amber-800/80" : 
                    "bg-teal-900/50 text-teal-350 border-teal-850/80";

                  return (
                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 pl-2 flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-extrabold text-[11px] ${avatarBg}`}>
                          {initials}
                        </div>
                        <span className="font-bold text-white">{user.full_name}</span>
                      </td>
                      <td className="py-3.5 text-slate-400">{user.email}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          user.role === "admin" ? "bg-rose-955/40 text-rose-400 border-rose-900/60" :
                          user.role === "specialist" ? "bg-indigo-950/40 text-indigo-400 border-indigo-900/60" :
                          user.role === "ambassador" ? "bg-amber-955/40 text-amber-400 border-amber-900/60" : 
                          "bg-slate-900/40 text-slate-400 border-slate-850"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`font-semibold ${user.is_active ? "text-emerald-400" : "text-rose-455"}`}>
                          {user.is_active ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="py-3.5 text-right pr-2 text-slate-500">{new Date(user.created_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
