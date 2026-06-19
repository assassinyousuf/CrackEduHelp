"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, AdminStats, Order, Payment, User, ChatMessage } from "@/lib/api";
import { 
  FileText, CheckCircle2, AlertCircle, DollarSign, Users, 
  Layers, Settings, Award, CheckSquare, XCircle, Send, MessageSquare, Download
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Admin Control Center</h1>
          <p className="text-sm text-slate-400">Welcome, {currentUser?.full_name}. Oversee orders, audits, and payouts.</p>
        </div>

        <div className="flex flex-wrap bg-slate-900/60 rounded-lg border border-slate-800 p-1">
          {[
            { id: "stats", label: "KPIs" },
            { id: "orders", label: "Order Desk" },
            { id: "payments", label: "Escrow Audits" },
            { id: "users", label: "Users" }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition ${
                activeTab === t.id ? "bg-teal-600 text-white shadow-lg shadow-teal-500/20" : "text-slate-400 hover:text-teal-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-950/40 text-emerald-400 rounded-lg text-sm font-semibold border border-emerald-900/60">
          {actionSuccess}
        </div>
      )}

      {actionErr && (
        <div className="p-4 bg-rose-955/40 text-rose-455 rounded-lg text-sm font-semibold border border-rose-900/60">
          {actionErr}
        </div>
      )}

      {/* ==========================================
          TAB 1: STATS KPI PANEL
          ========================================== */}
      {activeTab === "stats" && stats && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-2xl space-y-2 backdrop-blur-md hover-tilt">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500 uppercase">Total Orders</span>
                <Layers className="w-5 h-5 text-teal-450" />
              </div>
              <span className="block text-2xl font-black text-white">{stats.total_orders}</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-2xl space-y-2 backdrop-blur-md hover-tilt">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500 uppercase">Pending Requests</span>
                <AlertCircle className="w-5 h-5 text-teal-450" />
              </div>
              <span className="block text-2xl font-black text-white">{stats.pending_orders}</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-2xl space-y-2 backdrop-blur-md hover-tilt">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500 uppercase">Verified Revenue</span>
                <DollarSign className="w-5 h-5 text-teal-450" />
              </div>
              <span className="block text-2xl font-black text-emerald-450">£{stats.total_revenue}</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-2xl space-y-2 backdrop-blur-md hover-tilt">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500 uppercase">Referral Liability</span>
                <Award className="w-5 h-5 text-teal-450" />
              </div>
              <span className="block text-2xl font-black text-amber-450">£{stats.referral_payout_liability}</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-2xl space-y-4 backdrop-blur-md">
            <h3 className="font-extrabold text-sm text-slate-500 uppercase tracking-wider">Recent Activity Logs</h3>
            <div className="space-y-3 text-xs leading-relaxed text-slate-400">
              <p>✓ Startup seeder populated default credentials.</p>
              <p>✓ Audit engine logging administrative updates.</p>
              <p>✓ ESCROW logic running verification tasks automatically.</p>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: ORDERS MANAGEMENT
          ========================================== */}
      {activeTab === "orders" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Order selection list */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-2xl h-fit space-y-4 backdrop-blur-md">
            <h3 className="font-extrabold text-sm text-slate-500 uppercase tracking-wider px-2">Order Queue</h3>
            {orders.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-550">No projects submitted yet.</p>
            ) : (
              <div className="space-y-2">
                {orders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className={`w-full text-left p-4 rounded-xl border transition flex flex-col space-y-2 ${
                      selectedOrder?.id === o.id 
                        ? "bg-teal-955/40 border-teal-850" 
                        : "bg-slate-955/60 border-transparent hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-white truncate max-w-[150px]">{o.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 font-bold uppercase rounded-full border ${getStatusColor(o.status)}`}>
                        {o.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>{o.service_type}</span>
                      <span>£{o.quote_amount || "Unquoted"}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Configuration details */}
          {selectedOrder && (
            <div className="lg:col-span-2 space-y-6">
              
              {/* Order spec panel */}
              <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-2xl space-y-6 backdrop-blur-md">
                <div>
                  <span className="text-xs text-slate-500 block">Order ID: #{selectedOrder.id}</span>
                  <h2 className="text-xl font-bold text-white">{selectedOrder.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">Submitted by Student: {selectedOrder.student?.full_name} ({selectedOrder.student?.email})</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block uppercase font-semibold">Service Type</span>
                    <span className="font-bold text-slate-200">{selectedOrder.service_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-semibold">Deadline</span>
                    <span className="font-bold text-slate-200">{new Date(selectedOrder.deadline).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-semibold">Current Quote</span>
                    <span className="font-bold text-teal-400">£{selectedOrder.quote_amount || "Pending"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-semibold">Assigned Specialist</span>
                    <span className="font-bold text-indigo-400">
                      {selectedOrder.specialist?.full_name || "None"}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-955/60 border border-slate-800/80 p-4 rounded-xl text-xs space-y-1.5">
                  <span className="font-bold text-slate-400">Task details:</span>
                  <p className="text-slate-300 whitespace-pre-wrap">{selectedOrder.task_description}</p>
                </div>

                {/* Guidelines download */}
                {selectedOrder.files.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase block">Guideline Documents</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedOrder.files.map((file) => (
                        <div key={file.id} className="p-3 border border-slate-800 rounded-lg flex items-center justify-between text-xs bg-slate-955/40">
                          <span className="font-bold text-slate-300 truncate mr-2">{file.file_name} ({file.file_category})</span>
                          <a
                            href={api.getDownloadUrl(file.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal-450 hover:underline flex items-center space-x-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Adjust Quote form */}
              <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-2xl space-y-4 backdrop-blur-md">
                <h3 className="font-bold text-white flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-teal-450" />
                  <span>Administrative Actions</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  
                  {/* Quote Override form */}
                  <form onSubmit={handleOverrideQuote} className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Override Quote Price (£)</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" required value={overrideQuoteInput} onChange={(e) => setOverrideQuoteInput(e.target.value)}
                        className="border border-slate-800 bg-slate-955/60 text-white rounded p-2 text-xs flex-grow focus:outline-none focus:border-teal-500 placeholder-slate-650"
                        placeholder="e.g. 150.00"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded transition shrink-0 shadow-lg shadow-teal-500/20"
                      >
                        Override
                      </button>
                    </div>
                  </form>

                  {/* Specialist assignment dropdown */}
                  <form onSubmit={handleAssignSpecialist} className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Assign Specialist Partner</label>
                    <div className="flex gap-2">
                      <select 
                        value={selectedSpecialistId} onChange={(e) => setSelectedSpecialistId(e.target.value)}
                        className="border border-slate-800 bg-slate-955/60 text-white rounded p-2 text-xs flex-grow focus:outline-none focus:border-teal-500"
                      >
                        {specialists.map((s) => (
                          <option className="bg-slate-850 text-white" key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded transition shrink-0 shadow-lg shadow-teal-500/20"
                      >
                        Assign
                      </button>
                    </div>
                  </form>

                </div>
              </div>

              {/* Chat panel */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-2xl space-y-4 backdrop-blur-md">
                <h3 className="font-bold text-white flex items-center space-x-2">
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
                          <span className="block font-bold text-[10px] opacity-75">
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
          )}

        </div>
      )}

      {/* ==========================================
          TAB 3: PAYMENT PROOF AUDITING
          ========================================== */}
      {activeTab === "payments" && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl shadow-2xl p-6 overflow-hidden backdrop-blur-md">
          <h3 className="font-extrabold text-sm text-slate-500 uppercase tracking-wider mb-4">Pending Payments Queue</h3>

          {payments.filter(p => p.status === "pending").length === 0 ? (
            <p className="text-center py-10 text-slate-500 text-xs">No pending manual payment receipts awaiting verification.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Student ID</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Method</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Receipt Document</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {payments.filter(p => p.status === "pending").map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="py-4 font-bold text-white">#{p.order_id.slice(-8).toUpperCase()}</td>
                      <td className="py-4 text-slate-400">{p.student_id.slice(-8)}</td>
                      <td className="py-4 capitalize font-semibold">{p.payment_type}</td>
                      <td className="py-4 uppercase text-slate-400">{p.payment_method.replace("_", " ")}</td>
                      <td className="py-4 font-bold text-teal-450">£{p.amount}</td>
                      <td className="py-4">
                        {/* Link to static image on local server */}
                        <a 
                          href={api.getDownloadUrl(p.id)}  // backend endpoint parses payment or order file
                          target="_blank" rel="noreferrer"
                          className="text-teal-450 hover:underline font-bold"
                        >
                          View Receipt
                        </a>
                      </td>
                      <td className="py-4 text-right flex justify-end space-x-2">
                        <button
                          onClick={() => handleVerifyPayment(p.id, "approved")}
                          className="p-1 text-emerald-400 hover:bg-emerald-950/40 rounded transition"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleVerifyPayment(p.id, "rejected")}
                          className="p-1 text-rose-450 hover:bg-rose-955/40 rounded transition"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
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
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl shadow-2xl p-6 overflow-hidden backdrop-blur-md">
          <h3 className="font-extrabold text-sm text-slate-500 uppercase tracking-wider mb-4">User Directories</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="pb-3">Full Name</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">User Role</th>
                  <th className="pb-3">Active Status</th>
                  <th className="pb-3">Account Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {usersList.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/40">
                    <td className="py-4 font-bold text-white">{user.full_name}</td>
                    <td className="py-4 text-slate-400">{user.email}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        user.role === "admin" ? "bg-rose-955/40 text-rose-400 border-rose-900/60" :
                        user.role === "specialist" ? "bg-indigo-950/40 text-indigo-400 border-indigo-900/60" :
                        user.role === "ambassador" ? "bg-amber-955/40 text-amber-400 border-amber-900/60" : "bg-slate-900/40 text-slate-400 border-slate-850"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`font-semibold ${user.is_active ? "text-emerald-400" : "text-rose-400"}`}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4 text-slate-500">{new Date(user.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
