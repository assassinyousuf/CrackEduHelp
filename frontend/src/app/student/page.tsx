"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, Order, ChatMessage, User } from "@/lib/api";
import { 
  FileText, PlusCircle, CheckCircle2, AlertCircle, 
  Send, User as UserIcon, Calendar, Clock, DollarSign, 
  ShieldAlert, Upload, MessageSquare, Download, CheckCircle 
} from "lucide-react";

export default function StudentDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Dashboard state
  const [orders, setOrders] = useState<Order[]>();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  
  // Create order state
  const [title, setTitle] = useState("");
  const [university, setUniversity] = useState("");
  const [courseName, setCourseName] = useState("");
  const [serviceType, setServiceType] = useState("Report Formatting");
  const [taskDescription, setTaskDescription] = useState("");
  const [wordCount, setWordCount] = useState(1000);
  const [slideCount, setSlideCount] = useState(0);
  const [deadline, setDeadline] = useState("");
  const [priorityLevel, setPriorityLevel] = useState("standard");
  const [orderFiles, setOrderFiles] = useState<File | null>(null);

  // Payment states
  const [payAmount, setPayAmount] = useState(0);
  const [payType, setPayType] = useState("deposit");
  const [payMethod, setPayMethod] = useState("bank_transfer");
  const [payProof, setPayProof] = useState<File | null>(null);
  
  // Form messages
  const [formErr, setFormErr] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [payErr, setPayErr] = useState("");
  const [paySuccess, setPaySuccess] = useState("");
  
  // Initial check & redirect
  useEffect(() => {
    const user = api.getCurrentUser();
    if (!user || user.role !== "student") {
      router.push("/login");
    } else {
      setCurrentUser(user);
      loadOrders();
    }
  }, []);

  // Poll Chat Messages if an order is selected
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

  const loadOrders = async () => {
    try {
      const res = await api.getOrders();
      setOrders(res);
      if (res.length > 0 && !selectedOrder) {
        setSelectedOrder(res[0]);
      } else if (selectedOrder) {
        const updated = res.find(o => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadChat = async (orderId: string) => {
    try {
      const msgs = await api.getMessages(orderId);
      setChatMessages(msgs);
    } catch (err) {
      console.error("Failed to load chat history", err);
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
      console.error("Message send failed", err);
    }
  };

  // Submit Order wizard
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr("");
    setFormSuccess("");

    // Ethics check
    const prohibitedKeywords = ["exam", "quiz", "test", "cheat", "impersonate", "do my exam"];
    const descLower = taskDescription.toLowerCase();
    for (const kw of prohibitedKeywords) {
      if (descLower.includes(kw)) {
        setFormErr(`Warning: Description references prohibited academic services ('${kw}'). CreackEduHelp operates as an ethical academic productivity helper; we do not support exams, impersonation, or academic cheating.`);
        return;
      }
    }

    try {
      const order = await api.createOrder({
        title,
        university,
        course_name: courseName,
        service_type: serviceType,
        task_description: taskDescription,
        word_count: serviceType === "PPT Presentation" ? null : Number(wordCount),
        slide_count: serviceType === "PPT Presentation" ? Number(slideCount) : null,
        deadline: new Date(deadline).toISOString(),
        priority_level: priorityLevel
      });

      // Upload source file if attached
      if (orderFiles) {
        await api.uploadOrderFile(order.id, "source", orderFiles);
      }

      setFormSuccess("Order submitted successfully! Our administrators will review the requirements and issue a quotation.");
      loadOrders();
      setTimeout(() => {
        setActiveTab("list");
        setSelectedOrder(order);
        // Reset form
        setTitle("");
        setUniversity("");
        setCourseName("");
        setTaskDescription("");
        setOrderFiles(null);
      }, 2000);
    } catch (err: any) {
      setFormErr(err.message || "Failed to submit order. Check configuration.");
    }
  };

  // Manual payment submission
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayErr("");
    setPaySuccess("");

    if (!selectedOrder || !payProof || payAmount <= 0) {
      setPayErr("Please fill all payment parameters and upload screenshot proof.");
      return;
    }

    try {
      await api.submitPaymentProof(
        selectedOrder.id,
        payAmount,
        payType,
        payMethod,
        payProof
      );
      setPaySuccess("Payment proof uploaded! An administrator will review your receipt within a few hours.");
      setPayAmount(0);
      setPayProof(null);
      loadOrders();
    } catch (err: any) {
      setPayErr(err.message || "Payment upload failed.");
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Student Portal</h1>
          <p className="text-sm text-slate-500">Welcome, {currentUser?.full_name}. Submit formatting or slide design tasks below.</p>
        </div>

        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition ${
              activeTab === "list" ? "bg-teal-600 text-white" : "text-gray-500 hover:text-teal-600"
            }`}
          >
            My Orders
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition flex items-center space-x-1 ${
              activeTab === "create" ? "bg-teal-600 text-white" : "text-gray-500 hover:text-teal-600"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Task</span>
          </button>
        </div>
      </div>

      {activeTab === "create" ? (
        
        // ==========================================
        // SUBMIT ORDER SCREEN
        // ==========================================
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl border border-slate-100 shadow-sm mt-8 space-y-6">
          <div className="pb-4 border-b border-gray-100">
            <h2 className="text-xl font-bold">New Project Assistance Request</h2>
            <p className="text-xs text-slate-400">Provide guideline rules. Prices are computed instantly but admins can override based on details.</p>
          </div>

          {formErr && (
            <div className="p-4 bg-rose-50 text-rose-800 rounded-lg text-sm flex items-start space-x-2 border border-rose-100 leading-relaxed">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{formErr}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-sm font-semibold border border-emerald-100">
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleCreateOrder} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Task Title</label>
                <input 
                  type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-teal-500"
                  placeholder="e.g. Dissertation Formatting"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">University / Institute</label>
                <input 
                  type="text" required value={university} onChange={(e) => setUniversity(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-teal-500"
                  placeholder="e.g. Oxford University"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Course Name</label>
                <input 
                  type="text" required value={courseName} onChange={(e) => setCourseName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-teal-500"
                  placeholder="e.g. Econometrics II"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Service Type</label>
                <select 
                  value={serviceType} onChange={(e) => setServiceType(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-teal-500"
                >
                  <option value="PPT Presentation">PPT Presentation Design</option>
                  <option value="Report Formatting">Report Formatting & Layout</option>
                  <option value="Research Assistance">Research Assistance</option>
                  <option value="Proofreading & Editing">Proofreading & Editing</option>
                  <option value="Referencing & Citation">Referencing Audit</option>
                  <option value="Data Analysis">Data Analysis Support</option>
                  <option value="Programming Support">Programming Support</option>
                  <option value="Document Design">Academic Document Design</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Priority</label>
                <select 
                  value={priorityLevel} onChange={(e) => setPriorityLevel(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-teal-500"
                >
                  <option value="standard">Standard</option>
                  <option value="urgent">Urgent (+50%)</option>
                  <option value="express">Express (+100%)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceType !== "PPT Presentation" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Word Count</label>
                  <input 
                    type="number" min="100" value={wordCount} onChange={(e) => setWordCount(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Slide Count</label>
                  <input 
                    type="number" min="5" value={slideCount} onChange={(e) => setSlideCount(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Deadline Date</label>
                <input 
                  type="datetime-local" required value={deadline} onChange={(e) => setDeadline(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Project Outline & Instructions</label>
              <textarea 
                rows={5} required value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-teal-500"
                placeholder="List clear reference rules, typography margins, slide topics or draft layouts. DO NOT ask for exam assistance."
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Attach Guideline File / Draft Outline (.docx, .pdf, .pptx, .zip)</label>
              <input 
                type="file" onChange={(e) => setOrderFiles(e.target.files?.[0] || null)}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition"
            >
              Submit Order Request
            </button>
          </form>
        </div>
      ) : (
        
        // ==========================================
        // MY ORDERS VIEW (DUAL PANEL SCREEN)
        // ==========================================
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          
          {/* List panel */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm h-fit space-y-4">
            <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wider px-2">Project Listings</h3>
            
            {(!orders || orders.length === 0) ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No orders submitted yet. Click &quot;Submit Task&quot; above to get started.
              </div>
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
                      <span>£{o.quote_amount}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details & Action Panel */}
          {selectedOrder && (
            <div className="lg:col-span-2 space-y-6">
              
              {/* Core detail card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-start pb-4 border-b border-gray-100">
                  <div>
                    <span className="text-xs font-semibold text-slate-400">Order ID: #{selectedOrder.id.slice(-8).toUpperCase()}</span>
                    <h2 className="text-xl font-bold text-gray-900">{selectedOrder.title}</h2>
                  </div>
                  <span className={`px-3 py-1 font-bold text-xs uppercase rounded-full border ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status.replace("_", " ")}
                  </span>
                </div>

                {/* Timeline status bar */}
                <div className="py-2">
                  <span className="block text-xs font-semibold uppercase text-slate-400 mb-4">Milestone Tracker</span>
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-150 -translate-y-1/2 z-0"></div>
                    {["submitted", "deposit_paid", "in_progress", "final_review", "completed"].map((st, idx) => {
                      const stages = ["submitted", "under_review", "quoted", "deposit_paid", "assigned", "in_progress", "draft_submitted", "revision_requested", "final_review", "completed"];
                      const currentIdx = stages.indexOf(selectedOrder.status);
                      const stageIdx = stages.indexOf(st);
                      const isActive = currentIdx >= stageIdx && selectedOrder.status !== "cancelled";
                      return (
                        <div key={st} className="flex flex-col items-center z-10">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition ${
                            isActive ? "bg-teal-600 border-teal-500 text-white shadow-md shadow-teal-500/10" : "bg-white border-gray-200 text-slate-400"
                          }`}>
                            {isActive ? "✓" : idx + 1}
                          </span>
                          <span className="text-[10px] font-semibold uppercase mt-2 text-slate-500 bg-white px-1">
                            {st.replace("_", " ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-teal-600" />
                    <div>
                      <span className="block text-xs text-slate-400 uppercase">Deadline Date</span>
                      <span className="text-xs font-bold">{new Date(selectedOrder.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-teal-600" />
                    <div>
                      <span className="block text-xs text-slate-400 uppercase">Priority</span>
                      <span className="text-xs font-bold uppercase">{selectedOrder.priority_level}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-teal-600" />
                    <div>
                      <span className="block text-xs text-slate-400 uppercase">Total Estimate</span>
                      <span className="text-xs font-bold text-teal-600">£{selectedOrder.quote_amount || "Calculating..."}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-2">
                  <span className="font-bold text-slate-600">Outline guidelines:</span>
                  <p className="text-slate-500 leading-relaxed whitespace-pre-wrap">{selectedOrder.task_description}</p>
                </div>

                {/* Uploaded guidelines file */}
                {selectedOrder.files.length > 0 && (
                  <div className="space-y-2">
                    <span className="block text-xs font-semibold uppercase text-slate-400">Guidelines / Deliverable Assets</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedOrder.files.map((file) => (
                        <div key={file.id} className="p-3 border border-slate-100 rounded-lg flex items-center justify-between text-xs bg-white shadow-sm">
                          <div className="flex items-center space-x-2 truncate">
                            <FileText className="w-4 h-4 text-teal-600" />
                            <div className="truncate">
                              <span className="block font-bold text-slate-700 truncate">{file.file_name}</span>
                              <span className="text-[10px] text-slate-400 uppercase">{file.file_category}</span>
                            </div>
                          </div>
                          
                          {/* Deliverable logic check: lock final if balance is unpaid */}
                          {file.file_category === "final" && selectedOrder.status !== "completed" ? (
                            <div className="flex items-center text-rose-500 space-x-1">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold">LOCKED</span>
                            </div>
                          ) : (
                            <a
                              href={api.getDownloadUrl(file.id)}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-teal-600 hover:bg-teal-50 rounded"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Payments panel */}
              {selectedOrder.quote_amount && (
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-teal-600" />
                    <span>Payment Processing (30/70 Escrow)</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl text-xs leading-relaxed">
                    <div className="space-y-1">
                      <span className="block font-bold text-slate-700 uppercase">Payment Schedule:</span>
                      <p>1. 30% Deposit: <strong>£{selectedOrder.deposit_amount}</strong> (Required to start work)</p>
                      <p>2. 70% Balance: <strong>£{selectedOrder.final_amount}</strong> (Payable before final delivery)</p>
                    </div>
                    <div className="space-y-1">
                      <span className="block font-bold text-slate-700 uppercase">UK Manual Bank Details:</span>
                      <p>Bank: CreackEduHelp UK Ltd</p>
                      <p>Sort Code: 20-46-95 | Account: 82956105</p>
                      <p>Wise Email: wise@creackeduhelp.com</p>
                    </div>
                  </div>

                  {/* Payment proofs logs */}
                  <div className="space-y-2">
                    <span className="block text-xs font-semibold text-slate-400">Payment Auditing Logs</span>
                    {selectedOrder.payments.length === 0 ? (
                      <p className="text-xs text-slate-400">No payment proofs uploaded yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {selectedOrder.payments.map((p) => (
                          <div key={p.id} className="p-3 border border-slate-150 bg-white rounded-lg flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold capitalize">{p.payment_type} Payment</span>
                              <span className="text-[10px] text-slate-400 block">Method: {p.payment_method.replace("_", " ")}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-slate-700">£{p.amount}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                p.status === "approved" ? "bg-emerald-50 text-emerald-800" :
                                p.status === "rejected" ? "bg-rose-50 text-rose-800" : "bg-amber-50 text-amber-800"
                              }`}>
                                {p.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Upload payment form */}
                  {selectedOrder.status !== "completed" && (
                    <form onSubmit={handlePaymentSubmit} className="pt-4 border-t border-gray-100 space-y-4">
                      <span className="block text-xs font-semibold text-slate-400">Upload Transfer Proof Receipt</span>
                      
                      {payErr && (
                        <div className="p-3 bg-rose-50 text-rose-800 rounded-lg text-xs flex items-center space-x-1 border border-rose-100">
                          <AlertCircle className="w-4 h-4" />
                          <span>{payErr}</span>
                        </div>
                      )}

                      {paySuccess && (
                        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-100">
                          {paySuccess}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">PAYMENT TYPE</label>
                          <select 
                            value={payType} onChange={(e) => setPayType(e.target.value)}
                            className="w-full border border-gray-200 rounded p-2 text-xs"
                          >
                            <option value="deposit">30% Deposit</option>
                            <option value="final">70% Final Balance</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">PAYMENT METHOD</label>
                          <select 
                            value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                            className="w-full border border-gray-200 rounded p-2 text-xs"
                          >
                            <option value="bank_transfer">UK Bank Transfer</option>
                            <option value="wise">Wise Transfer</option>
                            <option value="paypal">PayPal</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">AMOUNT (£)</label>
                          <input 
                            type="number" step="0.01" required value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))}
                            className="w-full border border-gray-200 rounded p-2 text-xs"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="w-full">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">RECEIPT FILE SCREENSHOT (.png, .jpg, .pdf)</label>
                          <input 
                            type="file" required onChange={(e) => setPayProof(e.target.files?.[0] || null)}
                            className="w-full border border-gray-200 rounded p-2 text-xs"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full md:w-fit px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-lg transition mt-5 shrink-0"
                        >
                          Upload Proof
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Chat thread console */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-teal-600" />
                  <span>Support Discussion Console</span>
                </h3>

                <div className="h-64 overflow-y-auto border border-gray-100 rounded-xl p-4 bg-slate-50 space-y-3 flex flex-col">
                  {chatMessages.length === 0 ? (
                    <div className="text-center my-auto text-slate-400 text-xs">
                      No messages yet. Send a note to start discussing formatting guidelines.
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
                            {isMe ? "You" : msg.sender.full_name} ({msg.sender.role})
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
                    type="text"
                    required
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-grow border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-teal-500"
                    placeholder="Ask about revision updates or task parameters..."
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
    </div>
  );
}
