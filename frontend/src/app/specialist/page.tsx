"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, Order, ChatMessage, User } from "@/lib/api";
import { 
  FileText, CheckCircle2, AlertCircle, Send, Calendar, Clock, 
  MessageSquare, Download, Upload, Eye 
} from "lucide-react";

export default function SpecialistDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Dashboard state
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Deliverable upload state
  const [uploadCategory, setUploadCategory] = useState("draft");
  const [deliverableFile, setDeliverableFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [uploadErr, setUploadErr] = useState("");

  // Auth filter
  useEffect(() => {
    const user = api.getCurrentUser();
    if (!user || user.role !== "specialist") {
      router.push("/login");
    } else {
      setCurrentUser(user);
      loadOrders();
    }
  }, []);

  // Poll Chat Messages if an order is active
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

  // Upload deliverable draft/final files
  const handleUploadDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadErr("");
    setUploadSuccess("");

    if (!selectedOrder || !deliverableFile) {
      setUploadErr("Please select a file to upload.");
      return;
    }

    try {
      await api.uploadOrderFile(
        selectedOrder.id,
        uploadCategory,
        deliverableFile
      );
      setUploadSuccess(`Successfully uploaded ${uploadCategory} file! Order timeline advanced.`);
      setDeliverableFile(null);
      loadOrders();
    } catch (err: any) {
      setUploadErr(err.message || "File upload failed.");
    }
  };

  // Move status to in progress
  const startWork = async () => {
    if (!selectedOrder) return;
    try {
      await api.updateOrder(selectedOrder.id, { status: "in_progress" });
      loadOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "bg-slate-900/40 text-slate-400 border-slate-800";
      case "deposit_paid": return "bg-teal-950/40 text-teal-400 border-teal-900/60";
      case "assigned": return "bg-cyan-950/40 text-cyan-400 border-cyan-900/60";
      case "in_progress": return "bg-indigo-950/40 text-indigo-400 border-indigo-900/60";
      case "draft_submitted": return "bg-blue-950/40 text-blue-400 border-blue-900/60";
      case "final_review": return "bg-purple-950/40 text-purple-400 border-purple-900/60";
      case "completed": return "bg-emerald-950/40 text-emerald-400 border-emerald-900/60";
      default: return "bg-slate-900/40 text-slate-400 border-slate-800";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-100">
      
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white">Specialist Dashboard</h1>
        <p className="text-sm text-slate-400">Welcome, {currentUser?.full_name}. View assigned tasks and upload formatting drafts below.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* Left Side: Order Listing */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-2xl h-fit space-y-4 backdrop-blur-md">
          <h3 className="font-extrabold text-sm text-slate-500 uppercase tracking-wider px-2">Assigned Projects</h3>
          
          {orders.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No jobs assigned yet. Contact administrators to assign tasks to your profile.
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSelectedOrder(o)}
                  className={`w-full text-left p-4 rounded-xl border transition flex flex-col space-y-2 ${
                    selectedOrder?.id === o.id 
                      ? "bg-teal-950/40 border-teal-850" 
                      : "bg-slate-950/60 border-transparent hover:bg-slate-900/60"
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
                    <span>Deadline: {new Date(o.deadline).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Active Assignment Console */}
        {selectedOrder && (
          <div className="lg:col-span-2 space-y-6">
            
            {/* Project Details */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-2xl space-y-6 backdrop-blur-md">
              <div className="flex justify-between items-start pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-500">Order ID: #{selectedOrder.id.slice(-8).toUpperCase()}</span>
                  <h2 className="text-xl font-bold text-white">{selectedOrder.title}</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 font-bold text-xs uppercase rounded-full border ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status.replace("_", " ")}
                  </span>
                  {selectedOrder.status === "assigned" && (
                    <button
                      onClick={startWork}
                      className="px-3 py-1 bg-teal-600 hover:bg-teal-555 text-white font-bold text-xs rounded-full transition shadow-lg shadow-teal-500/20"
                    >
                      Start Work
                    </button>
                  )}
                </div>
              </div>

              {/* Deadline & Spec row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-teal-400" />
                  <div>
                    <span className="block text-xs text-slate-500 uppercase">Target Deadline</span>
                    <span className="text-xs font-bold text-slate-200">{new Date(selectedOrder.deadline).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-teal-400" />
                  <div>
                    <span className="block text-xs text-slate-500 uppercase">Priority Rating</span>
                    <span className="text-xs font-bold uppercase text-slate-200">{selectedOrder.priority_level}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-teal-400" />
                  <div>
                    <span className="block text-xs text-slate-500 uppercase">Service Category</span>
                    <span className="text-xs font-bold text-slate-200">{selectedOrder.service_type}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl text-xs space-y-2">
                <span className="font-bold text-slate-400">Student instructions and context:</span>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedOrder.task_description}</p>
              </div>

              {/* Order files and delivery links */}
              <div className="space-y-3">
                <span className="block text-xs font-semibold uppercase text-slate-500">Project Files</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedOrder.files.map((file) => (
                    <div key={file.id} className="p-3 border border-slate-800 rounded-lg flex items-center justify-between text-xs bg-slate-950/40 shadow-sm">
                      <div className="flex items-center space-x-2 truncate">
                        <FileText className="w-4 h-4 text-teal-400" />
                        <div className="truncate">
                          <span className="block font-bold text-slate-300 truncate">{file.file_name}</span>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">{file.file_category}</span>
                        </div>
                      </div>
                      <a
                        href={api.getDownloadUrl(file.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-teal-400 hover:bg-teal-950/40 rounded"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Deliverables Uploader Panel */}
            {selectedOrder.status !== "completed" && (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-2xl space-y-4 backdrop-blur-md">
                <h3 className="font-bold text-white flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-teal-400" />
                  <span>Upload Milestone Deliverables</span>
                </h3>

                {uploadErr && (
                  <div className="p-3 bg-rose-950/40 text-rose-400 rounded-lg text-xs flex items-center space-x-1 border border-rose-900/60">
                    <AlertCircle className="w-4 h-4" />
                    <span>{uploadErr}</span>
                  </div>
                )}

                {uploadSuccess && (
                  <div className="p-3 bg-emerald-950/40 text-emerald-400 rounded-lg text-xs font-semibold border border-emerald-900/60">
                    {uploadSuccess}
                  </div>
                )}

                <form onSubmit={handleUploadDeliverable} className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="w-full md:w-1/3">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">MILESTONE CATEGORY</label>
                    <select 
                      value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full border border-slate-800 rounded p-2.5 text-xs bg-slate-950/60 text-white focus:outline-none focus:border-teal-500"
                    >
                      <option className="bg-slate-850 text-white" value="draft">Review Draft (TOC/Outline)</option>
                      <option className="bg-slate-850 text-white" value="final">Final Deliverable (Locked until paid)</option>
                    </select>
                  </div>
                  
                  <div className="w-full">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">SELECT DELIVERABLE FILE</label>
                    <input 
                      type="file" required onChange={(e) => setDeliverableFile(e.target.files?.[0] || null)}
                      className="w-full border border-slate-800 rounded p-2 text-xs bg-slate-950/60 text-slate-300"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full md:w-fit px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg shadow-md transition shrink-0 h-10 shadow-lg shadow-teal-500/20"
                  >
                    Upload Asset
                  </button>
                </form>
              </div>
            )}

            {/* Chat Thread */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-2xl space-y-4 backdrop-blur-md">
              <h3 className="font-bold text-white flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-teal-400" />
                <span>Discussion Thread with Client</span>
              </h3>

              <div className="h-64 overflow-y-auto border border-slate-800 rounded-xl p-4 bg-slate-950/60 space-y-3 flex flex-col">
                {chatMessages.length === 0 ? (
                  <div className="text-center my-auto text-slate-500 text-xs">
                    No conversation logs recorded. Send a greeting to clarify guidelines.
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
                  type="text" required value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-grow border border-slate-800 bg-slate-950/60 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-teal-500 placeholder-slate-500"
                  placeholder="Respond to student revisions request or detail milestones..."
                />
                <button
                  type="submit"
                  className="p-3 bg-teal-600 hover:bg-teal-505 text-white rounded-lg transition shadow-lg shadow-teal-500/20"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
