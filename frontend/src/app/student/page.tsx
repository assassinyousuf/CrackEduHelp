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
      case "submitted": return "bg-slate-900/40 text-slate-400 border-slate-800";
      case "under_review": return "bg-amber-955/40 text-amber-400 border-amber-900/60";
      case "quoted": return "bg-blue-950/40 text-blue-400 border-blue-900/60";
      case "deposit_paid": return "bg-teal-955/40 text-teal-400 border-teal-900/60";
      case "assigned": return "bg-cyan-950/40 text-cyan-400 border-cyan-900/60";
      case "in_progress": return "bg-indigo-950/40 text-indigo-400 border-indigo-900/60";
      case "completed": return "bg-emerald-950/40 text-emerald-400 border-emerald-900/60";
      case "cancelled": return "bg-rose-955/40 text-rose-450 border-rose-900/60";
      default: return "bg-slate-900/40 text-slate-400 border-slate-800";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-100">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Student Portal</h1>
          <p className="text-sm text-slate-400">Welcome, {currentUser?.full_name}. Submit formatting or slide design tasks below.</p>
        </div>

        <div className="flex bg-slate-900/60 rounded-lg border border-slate-800 p-1">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition ${
              activeTab === "list" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-teal-400"
            }`}
          >
            My Orders
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition flex items-center space-x-1 ${
              activeTab === "create" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-teal-400"
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
        <div className="max-w-3xl mx-auto bg-slate-900/60 p-8 rounded-2xl border border-slate-800/80 shadow-2xl mt-8 space-y-6 backdrop-blur-md hover-tilt">
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white">New Project Assistance Request</h2>
            <p className="text-xs text-slate-500">Provide guideline rules. Prices are computed instantly but admins can override based on details.</p>
          </div>

          {formErr && (
            <div className="p-4 bg-rose-955/40 text-rose-400 rounded-lg text-sm flex items-start space-x-2 border border-rose-900/60 leading-relaxed">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{formErr}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-4 bg-emerald-950/40 text-emerald-400 rounded-lg text-sm font-semibold border border-emerald-900/60">
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleCreateOrder} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Task Title</label>
                <input 
                  type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-slate-800 rounded-lg p-3 text-sm bg-slate-950/60 text-white focus:outline-none focus:border-teal-500 placeholder-slate-600"
                  placeholder="e.g. Dissertation Formatting"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">University / Institute</label>
                <input 
                  type="text" required value={university} onChange={(e) => setUniversity(e.target.value)}
                  className="w-full border border-slate-800 rounded-lg p-3 text-sm bg-slate-950/60 text-white focus:outline-none focus:border-teal-500 placeholder-slate-600"
                  placeholder="e.g. Oxford University"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Course Name</label>
                <input 
                  type="text" required value={courseName} onChange={(e) => setCourseName(e.target.value)}
                  className="w-full border border-slate-800 rounded-lg p-3 text-sm bg-slate-950/60 text-white focus:outline-none focus:border-teal-500 placeholder-slate-600"
                  placeholder="e.g. Econometrics II"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Service Type</label>
                <select 
                  value={serviceType} onChange={(e) => setServiceType(e.target.value)}
                  className="w-full border border-slate-800 rounded-lg p-3 text-sm bg-slate-950/60 text-white focus:outline-none focus:border-teal-500"
                >
                  <option className="bg-slate-850 text-white" value="PPT Presentation">PPT Presentation Design</option>
                  <option className="bg-slate-850 text-white" value="Report Formatting">Report Formatting & Layout</option>
                  <option className="bg-slate-850 text-white" value="Research Assistance">Research Assistance</option>
                  <option className="bg-slate-850 text-white" value="Proofreading & Editing">Proofreading & Editing</option>
                  <option className="bg-slate-850 text-white" value="Referencing & Citation">Referencing Audit</option>
                  <option className="bg-slate-850 text-white" value="Data Analysis">Data Analysis Support</option>
                  <option className="bg-slate-850 text-white" value="Programming Support">Programming Support</option>
                  <option className="bg-slate-850 text-white" value="Document Design">Academic Document Design</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Priority</label>
                <select 
                  value={priorityLevel} onChange={(e) => setPriorityLevel(e.target.value)}
                  className="w-full border border-slate-800 rounded-lg p-3 text-sm bg-slate-950/60 text-white focus:outline-none focus:border-teal-500"
                >
                  <option className="bg-slate-850 text-white" value="standard">Standard</option>
                  <option className="bg-slate-850 text-white" value="urgent">Urgent (+50%)</option>
                  <option className="bg-slate-850 text-white" value="express">Express (+100%)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceType !== "PPT Presentation" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Word Count</label>
                  <input 
                    type="number" min="100" value={wordCount} onChange={(e) => setWordCount(Number(e.target.value))}
                    className="w-full border border-slate-800 rounded-lg p-3 text-sm bg-slate-950/60 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Slide Count</label>
                  <input 
                    type="number" min="5" value={slideCount} onChange={(e) => setSlideCount(Number(e.target.value))}
                    className="w-full border border-slate-800 rounded-lg p-3 text-sm bg-slate-950/60 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Deadline Date</label>
                <input 
                  type="datetime-local" required value={deadline} onChange={(e) => setDeadline(e.target.value)}
                  className="w-full border border-slate-800 rounded-lg p-3 text-sm bg-slate-950/60 text-slate-300 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Project Outline & Instructions</label>
              <textarea 
                rows={5} required value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)}
                className="w-full border border-slate-800 rounded-lg p-3 text-sm bg-slate-950/60 text-white focus:outline-none focus:border-teal-500 placeholder-slate-600"
                placeholder="List clear reference rules, typography margins, slide topics or draft layouts. DO NOT ask for exam assistance."
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Attach Guideline File / Draft Outline (.docx, .pdf, .pptx, .zip)</label>
              <input 
                type="file" onChange={(e) => setOrderFiles(e.target.files?.[0] || null)}
                className="w-full border border-slate-800 rounded-lg p-3 text-sm bg-slate-950/60 text-slate-350"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition shadow-lg shadow-teal-500/20"
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
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-2xl h-fit space-y-4 backdrop-blur-md">
            <h3 className="font-extrabold text-sm text-slate-500 uppercase tracking-wider px-2">Project Listings</h3>
            
            {(!orders || orders.length === 0) ? (
              <div className="text-center py-12 text-slate-500 text-sm">
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
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-2xl space-y-6 backdrop-blur-md">
                <div className="flex justify-between items-start pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Order ID: #{selectedOrder.id.slice(-8).toUpperCase()}</span>
                    <h2 className="text-xl font-bold text-white">{selectedOrder.title}</h2>
                  </div>
                  <span className={`px-3 py-1 font-bold text-xs uppercase rounded-full border ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status.replace("_", " ")}
                  </span>
                </div>

                {/* Timeline status bar */}
                <div className="py-2">
                  <span className="block text-xs font-semibold uppercase text-slate-500 mb-4">Milestone Tracker</span>
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-850 -translate-y-1/2 z-0"></div>
                    {["submitted", "deposit_paid", "in_progress", "final_review", "completed"].map((st, idx) => {
                      const stages = ["submitted", "under_review", "quoted", "deposit_paid", "assigned", "in_progress", "draft_submitted", "revision_requested", "final_review", "completed"];
                      const currentIdx = stages.indexOf(selectedOrder.status);
                      const stageIdx = stages.indexOf(st);
                      const isActive = currentIdx >= stageIdx && selectedOrder.status !== "cancelled";
                      return (
                        <div key={st} className="flex flex-col items-center z-10">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition ${
                            isActive ? "bg-teal-600 border-teal-500 text-white shadow-md shadow-teal-500/10" : "bg-slate-950 border-slate-850 text-slate-500"
                          }`}>
                            {isActive ? "✓" : idx + 1}
                          </span>
                          <span className="text-[10px] font-semibold uppercase mt-2 text-slate-500 bg-[#0d1527] px-1">
                            {st.replace("_", " ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-teal-400" />
                    <div>
                      <span className="block text-xs text-slate-500 uppercase">Deadline Date</span>
                      <span className="text-xs font-bold text-slate-200">{new Date(selectedOrder.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-teal-400" />
                    <div>
                      <span className="block text-xs text-slate-500 uppercase">Priority</span>
                      <span className="text-xs font-bold uppercase text-slate-200">{selectedOrder.priority_level}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-teal-400" />
                    <div>
                      <span className="block text-xs text-slate-500 uppercase">Total Estimate</span>
                      <span className="text-xs font-bold text-teal-400">£{selectedOrder.quote_amount || "Calculating..."}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl text-xs space-y-2">
                  <span className="font-bold text-slate-400">Outline guidelines:</span>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedOrder.task_description}</p>
                </div>

                {/* Uploaded guidelines file */}
                {selectedOrder.files.length > 0 && (
                  <div className="space-y-2">
                    <span className="block text-xs font-semibold uppercase text-slate-500">Guidelines / Deliverable Assets</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedOrder.files.map((file) => (
                        <div key={file.id} className="p-3 border border-slate-800 rounded-lg flex items-center justify-between text-xs bg-slate-955/40 shadow-sm">
                          <div className="flex items-center space-x-2 truncate">
                            <FileText className="w-4 h-4 text-teal-400" />
                            <div className="truncate">
                              <span className="block font-bold text-slate-300 truncate">{file.file_name}</span>
                              <span className="text-[10px] text-slate-500 uppercase">{file.file_category}</span>
                            </div>
                          </div>
                          
                          {/* Deliverable logic check: lock final if balance is unpaid */}
                          {file.file_category === "final" && selectedOrder.status !== "completed" ? (
                            <div className="flex items-center text-rose-455 space-x-1">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold">LOCKED</span>
                            </div>
                          ) : (
                            <a
                              href={api.getDownloadUrl(file.id)}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-teal-450 hover:bg-teal-950/40 rounded"
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
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-2xl space-y-4 backdrop-blur-md">
                  <h3 className="font-bold text-white flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-teal-400" />
                    <span>Payment Processing (30/70 Escrow)</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/60 border border-slate-800 p-4 rounded-xl text-xs leading-relaxed text-slate-300">
                    <div className="space-y-1">
                      <span className="block font-bold text-slate-400 uppercase">Payment Schedule:</span>
                      <p>1. 30% Deposit: <strong>£{selectedOrder.deposit_amount}</strong> (Required to start work)</p>
                      <p>2. 70% Balance: <strong>£{selectedOrder.final_amount}</strong> (Payable before final delivery)</p>
                    </div>
                    <div className="space-y-1">
                      <span className="block font-bold text-slate-400 uppercase">UK Manual Bank Details:</span>
                      <p>Bank: CreackEduHelp UK Ltd</p>
                      <p>Sort Code: 20-46-95 | Account: 82956105</p>
                      <p>Wise Email: wise@creackeduhelp.com</p>
                    </div>
                  </div>

                  {/* Payment proofs logs */}
                  <div className="space-y-2">
                    <span className="block text-xs font-semibold text-slate-500">Payment Auditing Logs</span>
                    {selectedOrder.payments.length === 0 ? (
                      <p className="text-xs text-slate-500">No payment proofs uploaded yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {selectedOrder.payments.map((p) => (
                          <div key={p.id} className="p-3 border border-slate-800 bg-slate-955/40 rounded-lg flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold capitalize">{p.payment_type} Payment</span>
                              <span className="text-[10px] text-slate-500 block">Method: {p.payment_method.replace("_", " ")}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-slate-300">£{p.amount}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                p.status === "approved" ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/60" :
                                p.status === "rejected" ? "bg-rose-955/40 text-rose-455 border-rose-900/60" : "bg-amber-955/40 text-amber-450 border-amber-900/60"
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
                    <form onSubmit={handlePaymentSubmit} className="pt-4 border-t border-slate-800 space-y-4">
                      <span className="block text-xs font-semibold text-slate-500">Upload Transfer Proof Receipt</span>
                      
                      {payErr && (
                        <div className="p-3 bg-rose-955/40 text-rose-400 rounded-lg text-xs flex items-center space-x-1 border border-rose-900/60">
                          <AlertCircle className="w-4 h-4" />
                          <span>{payErr}</span>
                        </div>
                      )}

                      {paySuccess && (
                        <div className="p-3 bg-emerald-950/40 text-emerald-400 rounded-lg text-xs font-semibold border border-emerald-900/60">
                          {paySuccess}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">PAYMENT TYPE</label>
                          <select 
                            value={payType} onChange={(e) => setPayType(e.target.value)}
                            className="w-full border border-slate-800 rounded p-2 text-xs bg-slate-950/60 text-white"
                          >
                            <option className="bg-slate-850 text-white" value="deposit">30% Deposit</option>
                            <option className="bg-slate-850 text-white" value="final">70% Final Balance</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">PAYMENT METHOD</label>
                          <select 
                            value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                            className="w-full border border-slate-800 rounded p-2 text-xs bg-slate-950/60 text-white"
                          >
                            <option className="bg-slate-850 text-white" value="bank_transfer">UK Bank Transfer</option>
                            <option className="bg-slate-850 text-white" value="wise">Wise Transfer</option>
                            <option className="bg-slate-850 text-white" value="paypal">PayPal</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">AMOUNT (£)</label>
                          <input 
                            type="number" step="0.01" required value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))}
                            className="w-full border border-slate-800 rounded p-2 text-xs bg-slate-950/60 text-white placeholder-slate-600"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="w-full">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">RECEIPT FILE SCREENSHOT (.png, .jpg, .pdf)</label>
                          <input 
                            type="file" required onChange={(e) => setPayProof(e.target.files?.[0] || null)}
                            className="w-full border border-slate-800 rounded p-2 text-xs bg-slate-950/60 text-slate-300"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full md:w-fit px-6 py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition mt-5 shrink-0 shadow-lg shadow-teal-500/20"
                        >
                          Upload Proof
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Chat thread console */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-2xl space-y-4 backdrop-blur-md">
                <h3 className="font-bold text-white flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-teal-400" />
                  <span>Support Discussion Console</span>
                </h3>

                <div className="h-64 overflow-y-auto border border-slate-800 rounded-xl p-4 bg-slate-955/60 space-y-3 flex flex-col">
                  {chatMessages.length === 0 ? (
                    <div className="text-center my-auto text-slate-500 text-xs">
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
                              : "bg-slate-900 text-slate-200 border border-slate-800 self-start rounded-tl-none shadow-sm"
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
                    className="flex-grow border border-slate-800 bg-slate-950/60 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-teal-500 placeholder-slate-500"
                    placeholder="Ask about revision updates or task parameters..."
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
    </div>
  );
}
