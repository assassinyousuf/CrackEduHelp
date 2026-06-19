import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "CreackEduHelp - Academic Support & Report Design Services",
  description: "Get premium and ethical academic report formatting, presentation slide design, proofreading, programming support, and research assistance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans bg-slate-950 text-slate-100 min-h-screen flex flex-col transition-colors duration-200`}>
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <span className="font-extrabold text-xl tracking-tight text-white">
                Creack<span className="text-teal-500">EduHelp</span>
              </span>
              <p className="text-sm">
                Premium presentation design, reports formatting, reference support, and academic productivity services.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm mb-4">Our Services</h3>
              <ul className="space-y-2 text-sm">
                <li>Report Formatting & Layout</li>
                <li>PPT/PPTX Slide Design</li>
                <li>Research & Referencing Guide</li>
                <li>Proofreading & Polishing</li>
                <li>Academic Programming Support</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm mb-4">Ethical Compliance</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                CreackEduHelp is positioned strictly as a productivity service. We do not write exams, impersonate students, or support plagiarism/cheating.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm mb-4">Contact Support</h3>
              <p className="text-sm">
                Email: support@creackeduhelp.com<br />
                WhatsApp: +44 20 7946 0958<br />
                Address: London, UK
              </p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-900 text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} CreackEduHelp. All rights reserved. Registered Academic Support Provider.
          </div>
        </footer>
      </body>
    </html>
  );
}
