"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { api, BlogPost } from "@/lib/api";
import { Calendar, ArrowLeft, BookOpen, ShieldCheck } from "lucide-react";

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();
  }, [resolvedParams.slug]);

  const loadPost = async () => {
    try {
      const data = await api.getPost(resolvedParams.slug);
      setPost(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500">Loading guide contents...</div>;
  }

  if (!post) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold">Article Not Found</h2>
        <p className="text-slate-500 text-sm">The study guide you are trying to read may have been archived.</p>
        <Link href="/blog" className="text-teal-600 font-bold hover:underline">
          Return to Blog Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <Link href="/blog" className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-400 hover:text-teal-400 transition">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Articles</span>
        </Link>

        <div className="bg-slate-900/60 border border-slate-800/80 hover-tilt rounded-2xl p-8 shadow-2xl space-y-6 backdrop-blur-md">
          <div className="space-y-4">
            <span className="inline-block px-2.5 py-1 bg-teal-950/40 text-teal-400 font-extrabold text-[10px] uppercase rounded border border-teal-900/50">
              {post.category}
            </span>
            <h1 className="text-3xl font-black text-white leading-tight">{post.title}</h1>
            
            <div className="flex items-center text-xs text-slate-500 space-x-2 pb-4 border-b border-slate-800">
              <Calendar className="w-3.5 h-3.5" />
              <span>Published on {new Date(post.created_at).toLocaleDateString()}</span>
              <span>&bull;</span>
              <span>By CreackEduHelp Operations</span>
            </div>
          </div>

          <div className="text-sm text-slate-300 leading-relaxed space-y-4 whitespace-pre-wrap">
            {post.content}
          </div>

          <div className="bg-teal-950/20 border border-teal-900/50 p-6 rounded-xl flex items-start space-x-4 mt-8">
            <ShieldCheck className="w-6 h-6 text-teal-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-white">Need layout or presentation structural support?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                CreackEduHelp specialists can format your literature references, optimize PowerPoint animations, and edit templates to match compliance rules. Create an account to request quotes.
              </p>
              <div className="pt-2">
                <Link href="/register" className="inline-block bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition shadow-lg shadow-teal-500/20">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
