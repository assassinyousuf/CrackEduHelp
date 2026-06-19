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
      case "submitted": return "bg-gray-100 text-gray-700 border-gray-200";
      case "under_review": return "bg-amber-50 text-amber-700 border-amber-200";
      case "quoted": return "bg-blue-50 text-blue-700 border-blue-200";
      case "deposit_paid": return "bg-teal-50 text-teal-700 border-teal-200";
      case "assigned": return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "in_progress": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "completed": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "cancelled": return "bg-rose-50 text-rose-700 border-rose-200";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Admin Control Center</h1>
          <p className="text-sm text-slate-500">Welcome, {currentUser?.full_name}. Oversee orders, audits, and payouts.</p>
        </div>

        <div className="flex flex-wrap bg-white rounded-lg border border-gray-200 p-1">
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
                activeTab === t.id ? "bg-teal-600 text-white" : "text-gray-500 hover:text-teal-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-sm font-semibold border border-emerald-100">
          {actionSuccess}
        </div>
      )}

      {actionErr && (
        <div className="p-4 bg-rose-50 text-rose-800 rounded-lg text-sm font-semibold border border-rose-100">
          {actionErr}
        </div>
      )}

      {/* ==========================================
          TAB 1: STATS KPI PANEL
          ========================================== */}
      {activeTab === "stats" && stats && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400 uppercase">Total Orders</span>
                <Layers className="w-5 h-5 text-teal-600" />
              </div>
              <span className="block text-2xl font-black text-slate-900">{stats.total_orders}</span>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400 uppercase">Pending Requests</span>
                <AlertCircle className="w-5 h-5 text-teal-600" />
              </div>
              <span className="block text-2xl font-black text-slate-900">{stats.pending_orders}</span>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400 uppercase">Verified Revenue</span>
                <DollarSign className="w-5 h-5 text-teal-600" />
              </div>
              <span className="block text-2xl font-black text-emerald-600">£{stats.total_revenue}</span>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400 uppercase">Referral Liability</span>
                <Award className="w-5 h-5 text-teal-600" />
              </div>
              <span className="block text-2xl font-black text-amber-600">£{stats.referral_payout_liability}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wider">Recent Activity Logs</h3>
            <div className="space-y-3 text-xs leading-relaxed text-slate-600">
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
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm h-fit space-y-4">
            <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wider px-2">Order Queue</h3>
            {orders.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-400">No projects submitted yet.</p>
            ) : (
              <div className="space-y-2">
                {orders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className={`w-full text-left p-4 rounded-xl border transition flex flex-col space-y-2 ${
                      selectedOrder?.id === o.id 
                        ? "bg-teal-50/50 border-teal-200" 
                        : "bg-slate-50 hover:bg-white border-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-gray-900 truncate max-w-[150px]">{o.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 font-bold uppercase rounded-full border ${getStatusColor(o.status)}`}>
                        {o.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500">
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
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-6">
                <div>
                  <span className="text-xs text-slate-400 block">Order ID: #{selectedOrder.id}</span>
                  <h2 className="text-xl font-bold text-gray-900">{selectedOrder.title}</h2>
                  <p className="text-xs text-slate-500 mt-1">Submitted by Student: {selectedOrder.student?.full_name} ({selectedOrder.student?.email})</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block uppercase font-semibold">Service Type</span>
                    <span className="font-bold">{selectedOrder.service_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-semibold">Deadline</span>
                    <span className="font-bold">{new Date(selectedOrder.deadline).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-semibold">Current Quote</span>
                    <span className="font-bold text-teal-600">£{selectedOrder.quote_amount || "Pending"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-semibold">Assigned Specialist</span>
                    <span className="font-bold text-indigo-600">
                      {selectedOrder.specialist?.full_name || "None"}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-1.5">
                  <span className="font-bold text-slate-600">Task details:</span>
                  <p className="text-slate-500 whitespace-pre-wrap">{selectedOrder.task_description}</p>
                </div>

                {/* Guidelines download */}
                {selectedOrder.files.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase block">Guideline Documents</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedOrder.files.map((file) => (
                        <div key={file.id} className="p-3 border border-slate-100 rounded-lg flex items-center justify-between text-xs bg-white">
                          <span className="font-bold text-slate-700 truncate mr-2">{file.file_name} ({file.file_category})</span>
                          <a
                            href={api.getDownloadUrl(file.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal-600 hover:underline flex items-center space-x-1"
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
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-teal-600" />
                  <span>Administrative Actions</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  
                  {/* Quote Override form */}
                  <form onSubmit={handleOverrideQuote} className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Override Quote Price (£)</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" required value={overrideQuoteInput} onChange={(e) => setOverrideQuoteInput(e.target.value)}
                        className="border border-gray-200 rounded p-2 text-xs flex-grow focus:outline-none focus:border-teal-500"
                        placeholder="e.g. 150.00"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded transition shrink-0"
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
                        className="border border-gray-200 rounded p-2 text-xs flex-grow bg-white focus:outline-none focus:border-teal-500"
                      >
                        {specialists.map((s) => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded transition shrink-0"
                      >
                        Assign
                      </button>
                    </div>
                  </form>

                </div>
              </div>

              {/* Chat panel */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-teal-600" />
                  <span>Discussion Feeds (Join Thread)</span>
                </h3>

                <div className="h-64 overflow-y-auto border border-gray-100 rounded-xl p-4 bg-slate-50 space-y-3 flex flex-col">
                  {chatMessages.length === 0 ? (
                    <div className="text-center my-auto text-slate-400 text-xs">
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
                              : "bg-white text-gray-800 border border-slate-100 self-start rounded-tl-none shadow-sm"
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
                    className="flex-grow border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-teal-500"
                    placeholder="Provide customer support updates or review deliverables..."
                  />
                  <button
                    type="submit"
                    className="p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
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
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 overflow-hidden">
          <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wider mb-4">Pending Payments Queue</h3>

          {payments.filter(p => p.status === "pending").length === 0 ? (
            <p className="text-center py-10 text-slate-400 text-xs">No pending manual payment receipts awaiting verification.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-slate-400 font-semibold uppercase">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Student ID</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Method</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Receipt Document</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-slate-700">
                  {payments.filter(p => p.status === "pending").map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-4 font-bold text-gray-900">#{p.order_id.slice(-8).toUpperCase()}</td>
                      <td className="py-4 text-slate-500">{p.student_id.slice(-8)}</td>
                      <td className="py-4 capitalize font-semibold">{p.payment_type}</td>
                      <td className="py-4 uppercase text-slate-500">{p.payment_method.replace("_", " ")}</td>
                      <td className="py-4 font-bold text-teal-600">£{p.amount}</td>
                      <td className="py-4">
                        {/* Link to static image on local server */}
                        <a 
                          href={api.getDownloadUrl(p.id)}  // backend endpoint parses payment or order file
                          target="_blank" rel="noreferrer"
                          className="text-teal-600 hover:underline font-bold"
                        >
                          View Receipt
                        </a>
                      </td>
                      <td className="py-4 text-right flex justify-end space-x-2">
                        <button
                          onClick={() => handleVerifyPayment(p.id, "approved")}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleVerifyPayment(p.id, "rejected")}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded"
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
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 overflow-hidden">
          <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wider mb-4">User Directories</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-slate-400 font-semibold uppercase">
                  <th className="pb-3">Full Name</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">User Role</th>
                  <th className="pb-3">Active Status</th>
                  <th className="pb-3">Account Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-slate-700">
                {usersList.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50">
                    <td className="py-4 font-bold text-gray-900">{user.full_name}</td>
                    <td className="py-4 text-slate-500">{user.email}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        user.role === "admin" ? "bg-rose-50 text-rose-800" :
                        user.role === "specialist" ? "bg-indigo-50 text-indigo-800" :
                        user.role === "ambassador" ? "bg-amber-50 text-amber-800" : "bg-gray-50 text-gray-800"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`font-semibold ${user.is_active ? "text-emerald-600" : "text-rose-500"}`}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4 text-slate-400">{new Date(user.created_at).toLocaleDateString()}</td>
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
