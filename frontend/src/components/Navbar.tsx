"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, User } from "@/lib/api";
import { BookOpen, LogOut, LayoutDashboard, Menu, X } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Watch storage changes to sync user status
  useEffect(() => {
    setUser(api.getCurrentUser());
    const interval = setInterval(() => {
      setUser(api.getCurrentUser());
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    api.logout();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    switch (user.role) {
      case "admin": return "/admin";
      case "specialist": return "/specialist";
      case "ambassador": return "/ambassador";
      default: return "/student";
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="p-2 bg-teal-600 rounded-lg text-slate-950 font-bold flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </span>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Creack<span className="text-teal-500">EduHelp</span>
              </span>
            </Link>
          </div>
 
          {/* Desktop links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-sm font-medium text-slate-350 hover:text-teal-400 transition-colors">
              Home
            </Link>
            <Link href="/blog" className="text-sm font-medium text-slate-350 hover:text-teal-400 transition-colors">
              Blog
            </Link>
            <Link href="/#services" className="text-sm font-medium text-slate-350 hover:text-teal-400 transition-colors">
              Services
            </Link>
            <Link href="/#faq" className="text-sm font-medium text-slate-350 hover:text-teal-400 transition-colors">
              FAQs
            </Link>
            <Link href="/#contact" className="text-sm font-medium text-slate-350 hover:text-teal-400 transition-colors">
              Consultation
            </Link>
          </div>
 
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href={getDashboardLink()}
                  className="inline-flex items-center space-x-1.5 px-4 h-10 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center space-x-1 px-3 h-10 text-sm font-medium text-slate-300 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="px-4 h-10 inline-flex items-center text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-4 h-10 inline-flex items-center text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
 
          {/* Mobile menu trigger */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-400 hover:text-white focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
 
      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-900 bg-slate-950 transition-all duration-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-teal-455"
            >
              Home
            </Link>
            <Link
              href="/blog"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-teal-455"
            >
              Blog
            </Link>
            <Link
              href="/#services"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-teal-455"
            >
              Services
            </Link>
            <Link
              href="/#contact"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-900 hover:text-teal-455"
            >
              Consultation
            </Link>
            {user ? (
              <>
                <Link
                  href={getDashboardLink()}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-semibold text-white bg-teal-600 hover:bg-teal-700"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-slate-900"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="pt-4 pb-2 border-t border-slate-900 flex flex-col space-y-2 px-3">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-center px-4 py-2 border border-slate-800 rounded-md text-base font-semibold text-slate-300 hover:bg-slate-900"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="text-center px-4 py-2 bg-teal-600 rounded-md text-base font-semibold text-white hover:bg-teal-700"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
