"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { 
  Sparkles, ShieldCheck, CheckCircle2, AlertTriangle, 
  HelpCircle, MessageCircle, BarChart2, Laptop, 
  FileText, PenTool, CheckSquare, Bookmark, Layers, Send
} from "lucide-react";

export default function LandingPage() {
  // Pricing Calculator State
  const [serviceType, setServiceType] = useState("Report Formatting");
  const [wordCount, setWordCount] = useState(1000);
  const [slideCount, setSlideCount] = useState(0);
  const [priority, setPriority] = useState("standard");
  const [estimate, setEstimate] = useState({
    estimated_total: 65.00,
    deposit_required: 19.50,
    final_balance: 45.50
  });

  // Contact Form State
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [contactSuccess, setContactSuccess] = useState(false);

  // Trigger Quote Estimation call on state changes
  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        const res = await api.estimateQuote({
          service_type: serviceType,
          word_count: Number(wordCount),
          slide_count: Number(slideCount),
          priority_level: priority
        });
        setEstimate(res);
      } catch (err) {
        // Local client fallback calculation if backend isn't up during static check
        const base = serviceType === "PPT Presentation" ? 30 : 20;
        const perWord = serviceType === "PPT Presentation" ? 0 : 0.04;
        const perSlide = serviceType === "PPT Presentation" ? 6 : 0;
        const mult = priority === "express" ? 2.0 : priority === "urgent" ? 1.5 : 1.0;
        const total = (base + wordCount * perWord + slideCount * perSlide) * mult;
        setEstimate({
          estimated_total: Number(total.toFixed(2)),
          deposit_required: Number((total * 0.3).toFixed(2)),
          final_balance: Number((total * 0.7).toFixed(2))
        });
      }
    };
    fetchEstimate();
  }, [serviceType, wordCount, slideCount, priority]);

  // Lead Form submission
  const handleConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.submitLead({
        type: "consultation",
        email: contactEmail,
        name: contactName,
        message: contactMsg
      });
      setContactSuccess(true);
      setContactName("");
      setContactEmail("");
      setContactMsg("");
    } catch (err) {
      alert("Submission failed. Please email support@creackeduhelp.com directly.");
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-24 pb-28 bg-slate-950 text-white">
        
        {/* Starry Nebula / Background Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,118,110,0.15),transparent_70%)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f766e10_1px,transparent_1px),linear-gradient(to_bottom,#0f766e10_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-40"></div>

        {/* 3D Perspective Floor Plane */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-[60%] border-t border-teal-500/10 pointer-events-none grid-3d-floor">
          <div className="laser-beam-1"></div>
          <div className="laser-beam-2"></div>
        </div>

        {/* 3D Perspective Ceiling Plane */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[40%] border-b border-teal-500/10 pointer-events-none grid-3d-ceiling">
          <div className="laser-beam-1 [animation-delay:3s]"></div>
        </div>

        {/* Floating 3D Glowing Nebulas */}
        <div className="absolute top-10 left-1/4 w-[450px] h-[450px] bg-teal-500/15 rounded-full filter blur-[100px] pointer-events-none animate-pulse"></div>
        <div className="absolute top-20 right-1/4 w-[350px] h-[350px] bg-indigo-500/10 rounded-full filter blur-[90px] pointer-events-none animate-pulse duration-5000"></div>
        <div className="absolute -bottom-10 left-1/3 w-[300px] h-[300px] bg-emerald-500/10 rounded-full filter blur-[80px] pointer-events-none"></div>

        {/* Floating 3D Wireframe Cubes */}
        <div className="absolute top-16 left-12 md:left-24 lg:left-36 animate-[float-slow_8s_ease-in-out_infinite] pointer-events-none opacity-40 md:opacity-60">
          <div className="cube-scene">
            <div className="cube-3d">
              <div className="cube-face cube-face-front"></div>
              <div className="cube-face cube-face-back"></div>
              <div className="cube-face cube-face-left"></div>
              <div className="cube-face cube-face-right"></div>
              <div className="cube-face cube-face-top"></div>
              <div className="cube-face cube-face-bottom"></div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-20 right-12 md:right-24 lg:right-36 animate-[float-slow-reverse_10s_ease-in-out_infinite] pointer-events-none opacity-40 md:opacity-60">
          <div className="cube-scene">
            <div className="cube-3d [animation-duration:25s]">
              <div className="cube-face cube-face-indigo cube-face-front"></div>
              <div className="cube-face cube-face-indigo cube-face-back"></div>
              <div className="cube-face cube-face-indigo cube-face-left"></div>
              <div className="cube-face cube-face-indigo cube-face-right"></div>
              <div className="cube-face cube-face-indigo cube-face-top"></div>
              <div className="cube-face cube-face-indigo cube-face-bottom"></div>
            </div>
          </div>
        </div>

        <div className="absolute top-1/2 right-1/3 animate-[float-slow_12s_ease-in-out_infinite] pointer-events-none opacity-20">
          <div className="cube-scene-sm">
            <div className="cube-3d [animation-duration:12s]">
              <div className="cube-face cube-face-sm cube-face-emerald cube-face-sm-front"></div>
              <div className="cube-face cube-face-sm cube-face-emerald cube-face-sm-back"></div>
              <div className="cube-face cube-face-sm cube-face-emerald cube-face-sm-left"></div>
              <div className="cube-face cube-face-sm cube-face-emerald cube-face-sm-right"></div>
              <div className="cube-face cube-face-sm cube-face-emerald cube-face-sm-top"></div>
              <div className="cube-face cube-face-sm cube-face-emerald cube-face-sm-bottom"></div>
            </div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6 text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-teal-950/80 border border-teal-500/20 text-teal-400 text-xs font-semibold rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Professional Academic Support Network</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-black leading-tight text-white">
                Academic Support for <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Busy Students</span>
              </h1>
              
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                Professional assistance for presentations, report formatting, proofreading, research indexing support, and academic coding projects.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/register"
                  className="px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 transition-all transform hover:-translate-y-0.5"
                >
                  Submit Task
                </Link>
                <a
                  href="#calculator"
                  className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold rounded-xl border border-slate-800 transition-all transform hover:-translate-y-0.5"
                >
                  Get Quote
                </a>
              </div>
              
              {/* Statistics row */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-800/80">
                <div>
                  <span className="block text-2xl font-extrabold text-white">12,450+</span>
                  <span className="text-xs text-slate-400">Orders Completed</span>
                </div>
                <div>
                  <span className="block text-2xl font-extrabold text-white">98.7%</span>
                  <span className="text-xs text-slate-400">Student Satisfaction</span>
                </div>
                <div>
                  <span className="block text-2xl font-extrabold text-white">120+</span>
                  <span className="text-xs text-slate-400">Active Specialists</span>
                </div>
              </div>
            </div>

            {/* Visual Hero Block (Dark Glassmorphic layout) */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-2xl p-8 space-y-6 hover-tilt">
              <div className="flex items-center space-x-2 pb-4 border-b border-slate-800">
                <ShieldCheck className="text-teal-400 w-6 h-6" />
                <h3 className="font-extrabold text-lg text-white">Academic Integrity Standards</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                CreackEduHelp operates with strict compliance to global university guidelines. We empower students with high-quality formatting, editorial assistance, and template designs to optimize study workflows.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-start space-x-3">
                  <span className="text-teal-400 bg-teal-950/50 p-1 rounded-full"><CheckCircle2 className="w-4 h-4" /></span>
                  <p className="text-xs font-semibold text-slate-300">Allowed: Layout formatting, editing, references audit, slide template design.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-rose-400 bg-rose-950/50 p-1 rounded-full"><AlertTriangle className="w-4 h-4" /></span>
                  <p className="text-xs font-semibold text-slate-300">Prohibited: Impersonation, exam-taking, ghost-writing, credential sharing.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. SERVICES SECTION */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold text-gray-900">Permitted Support Services</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              We connect students with specialists to optimize layout appearance, structure presentation files, and check coding syntax.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
            <div className="p-6 bg-slate-50 hover:bg-teal-50/40 rounded-xl transition border border-slate-100">
              <Layers className="text-teal-600 w-8 h-8 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">PPT Presentation Design</h3>
              <p className="text-sm text-slate-500">Design high-impact slide layouts, data structures, and animations for your defense or seminars.</p>
            </div>
            
            <div className="p-6 bg-slate-50 hover:bg-teal-50/40 rounded-xl transition border border-slate-100">
              <FileText className="text-teal-600 w-8 h-8 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Report Formatting</h3>
              <p className="text-sm text-slate-500">Align margins, tables of contents, page numbers, and custom templates according to style guides.</p>
            </div>
            
            <div className="p-6 bg-slate-50 hover:bg-teal-50/40 rounded-xl transition border border-slate-100">
              <PenTool className="text-teal-600 w-8 h-8 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Proofreading & Editing</h3>
              <p className="text-sm text-slate-500">Review grammar, flow, passive sentence structure, and terminology definitions.</p>
            </div>

            <div className="p-6 bg-slate-50 hover:bg-teal-50/40 rounded-xl transition border border-slate-100">
              <Bookmark className="text-teal-600 w-8 h-8 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Referencing & Citations</h3>
              <p className="text-sm text-slate-500">Ensure absolute accuracy for Harvard, APA, IEEE, or Oxford style catalogs.</p>
            </div>

            <div className="p-6 bg-slate-50 hover:bg-teal-50/40 rounded-xl transition border border-slate-100">
              <BarChart2 className="text-teal-600 w-8 h-8 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Data Analysis Support</h3>
              <p className="text-sm text-slate-500">Guidance on formatting charts, SPSS output structures, and Excel graphs.</p>
            </div>

            <div className="p-6 bg-slate-50 hover:bg-teal-50/40 rounded-xl transition border border-slate-100">
              <Laptop className="text-teal-600 w-8 h-8 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Programming Support</h3>
              <p className="text-sm text-slate-500">Syntax auditing, code refactoring guidance, and documentation generation.</p>
            </div>

            <div className="p-6 bg-slate-50 hover:bg-teal-50/40 rounded-xl transition border border-slate-100">
              <CheckSquare className="text-teal-600 w-8 h-8 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Research Assistance</h3>
              <p className="text-sm text-slate-500">Assist in searching catalogs, outlining literature, and summary compiling.</p>
            </div>

            <div className="p-6 bg-slate-50 hover:bg-teal-50/40 rounded-xl transition border border-slate-100">
              <Sparkles className="text-teal-600 w-8 h-8 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Document Design</h3>
              <p className="text-sm text-slate-500">LaTeX layout adjustments, typography, and graphic illustrations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DYNAMIC CALCULATOR */}
      <section id="calculator" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold">Instant Quote Estimator</h2>
            <p className="text-slate-400">
              Our transparent pricing engine helps you calculate the estimated cost. Admin checks individual requirements to confirm final costs.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">30%</span>
                <p className="text-sm text-slate-300">Pay only a 30% deposit upfront to assign your specialist and start work.</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">70%</span>
                <p className="text-sm text-slate-300">Remaining balance is collected only after you review and approve the draft deliverables.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 space-y-6 hover-tilt">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Service Category</label>
              <select 
                value={serviceType}
                onChange={(e) => {
                  setServiceType(e.target.value);
                  if (e.target.value === "PPT Presentation") {
                    setWordCount(0);
                    setSlideCount(10);
                  } else {
                    setWordCount(1000);
                    setSlideCount(0);
                  }
                }}
                className="w-full bg-slate-750 border border-slate-600 rounded-lg p-3 text-sm focus:outline-none focus:border-teal-500"
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

            {serviceType !== "PPT Presentation" ? (
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
                  <span>WORD COUNT</span>
                  <span>{wordCount} words</span>
                </div>
                <input 
                  type="range" 
                  min="250" 
                  max="10000" 
                  step="250"
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
                  <span>SLIDE COUNT</span>
                  <span>{slideCount} slides</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="50" 
                  step="1"
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Urgency Level</label>
              <div className="grid grid-cols-3 gap-2">
                {["standard", "urgent", "express"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      priority === p 
                        ? "bg-teal-600 border-teal-500 text-white" 
                        : "bg-slate-750 border-slate-600 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4 grid grid-cols-3 gap-2 text-center">
              <div className="border-r border-slate-700">
                <span className="block text-xs text-slate-400">Total Quote</span>
                <span className="text-xl font-bold text-teal-400">£{estimate.estimated_total}</span>
              </div>
              <div className="border-r border-slate-700">
                <span className="block text-xs text-slate-400">30% Deposit</span>
                <span className="text-xl font-bold text-white">£{estimate.deposit_required}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400">Final Balance</span>
                <span className="text-xl font-bold text-slate-300">£{estimate.final_balance}</span>
              </div>
            </div>
            
            <Link
              href="/register"
              className="block text-center py-3 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-xl transition"
            >
              Book this project now
            </Link>
          </div>

        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold text-gray-900">How It Works</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Our structural escrow-based progression guarantees premium outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 relative">
            {[
              { step: "1", title: "Submit Request", desc: "Upload details and outline parameters." },
              { step: "2", title: "Receive Quote", desc: "Our admins verify and send quotation override rules." },
              { step: "3", title: "Pay Deposit", desc: "Pay initial 30% to assign professional specialist." },
              { step: "4", title: "Work Starts", desc: "Specialist updates milestones via interactive dashboard." },
              { step: "5", title: "Review Delivery", desc: "Evaluate draft quality, submit feedback, download files." },
              { step: "6", title: "Final Deliverable", desc: "Complete 70% escrow and unlock the clean final work." }
            ].map((s, idx) => (
              <div key={idx} className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-left space-y-2 relative">
                <span className="absolute -top-3 left-6 w-8 h-8 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  {s.step}
                </span>
                <h3 className="font-extrabold text-base text-gray-900 pt-2">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. TESTIMONIALS */}
      <section className="py-20 bg-teal-50/40 border-y border-teal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <h2 className="text-3xl font-extrabold text-gray-900">Loved by Students Worldwide</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
              <p className="text-sm italic text-gray-600">
                &quot;The referencing support saved my dissertation. I had 60+ citations in a mess. The specialist formatted everything in perfect Harvard style in under 24 hours!&quot;
              </p>
              <div>
                <span className="block font-bold text-gray-900">Emily R.</span>
                <span className="text-xs text-slate-500">MSc Finance Student</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
              <p className="text-sm italic text-gray-600">
                &quot;Amazing slides! I gave them a rough word outline and they converted it into an outstanding PowerPoint presentation that looked incredibly clean and professional.&quot;
              </p>
              <div>
                <span className="block font-bold text-gray-900">Marcus T.</span>
                <span className="text-xs text-slate-500">Engineering Undergraduate</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
              <p className="text-sm italic text-gray-600">
                &quot;Super quick response on programming assistance. The specialist showed me exactly where my syntax compilation errors were and helped me document the code cleanly.&quot;
              </p>
              <div>
                <span className="block font-bold text-gray-900">Aisha K.</span>
                <span className="text-xs text-slate-500">Computer Science Student</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-extrabold text-gray-900">Frequently Asked Questions</h2>
            <p className="text-slate-500">Got questions? We have answers.</p>
          </div>

          <div className="space-y-6">
            {[
              { q: "Is this service ethically compliant with my university policies?", a: "Yes, absolutely. We do not participate in exam cheating, ghost-write, or provide credential sharing. We provide editorial formatting, referencing checks, data layout, and syntax debugging. You remain the author of your own work." },
              { q: "How does the manual payment system work?", a: "To make services accessible without high processing fees, we support direct UK Bank Transfer, Wise, and PayPal. Simply upload your receipt screenshot after completing the deposit or final payment, and our administrator validates it in minutes." },
              { q: "What is your revision policy?", a: "If the formatted draft does not align with your initial guidelines, you can request unlimited revisions within 14 days of delivery. Our specialists will adjust formatting, slides, or citation errors quickly." },
              { q: "Can I cancel my order?", a: "You can request cancellation at any point before a specialist is assigned. Once a specialist begins working on your formatting or slide design, the 30% deposit becomes non-refundable to compensate their labor." }
            ].map((f, idx) => (
              <div key={idx} className="p-6 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <h3 className="font-extrabold text-gray-900 flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5 text-teal-600 shrink-0" />
                  <span>{f.q}</span>
                </h3>
                <p className="text-sm text-slate-600 pl-7 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CONTACT / LEAD CAPTURE */}
      <section id="contact" className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold text-gray-900">Free Consultation & Advisory</h2>
            <p className="text-slate-500">
              Submit your project layout questions or general questions below and our operations desk will review and advise.
            </p>
          </div>

          <form onSubmit={handleConsultation} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-left space-y-4">
            {contactSuccess && (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-sm font-semibold border border-emerald-100">
                Inquiry received successfully! Our operations desk will get back to you shortly.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Your Name</label>
                <input 
                  type="text" 
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-teal-500"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-teal-500"
                  placeholder="john@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">How can we assist you?</label>
              <textarea 
                rows={4}
                required
                value={contactMsg}
                onChange={(e) => setContactMsg(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-teal-500"
                placeholder="e.g. I need formatting help on my 5000 word dissertation template."
              ></textarea>
            </div>
            
            <button
              type="submit"
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit Request</span>
            </button>
          </form>

          {/* WhatsApp floating button placeholder */}
          <div className="pt-4 flex justify-center">
            <a 
              href="https://wa.me/442079460958"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full shadow-lg shadow-emerald-600/10 transition"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>

        </div>
      </section>

    </div>
  );
}
