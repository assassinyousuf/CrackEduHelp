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
    <div className="bg-slate-50 text-slate-900 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <Link href="/blog" className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-teal-600 transition">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Articles</span>
        </Link>

        <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm space-y-6">
          <div className="space-y-4">
            <span className="inline-block px-2.5 py-1 bg-teal-50 text-teal-700 font-extrabold text-[10px] uppercase rounded border border-teal-100">
              {post.category}
            </span>
            <h1 className="text-3xl font-black text-slate-900 leading-tight">{post.title}</h1>
            
            <div className="flex items-center text-xs text-slate-400 space-x-2 pb-4 border-b border-gray-100">
              <Calendar className="w-3.5 h-3.5" />
              <span>Published on {new Date(post.created_at).toLocaleDateString()}</span>
              <span>&bull;</span>
              <span>By CreackEduHelp Operations</span>
            </div>
          </div>

          <div className="text-sm text-slate-700 leading-relaxed space-y-4 whitespace-pre-wrap">
            {post.content}
          </div>

          <div className="bg-teal-50/50 border border-teal-100 p-6 rounded-xl flex items-start space-x-4 mt-8">
            <ShieldCheck className="w-6 h-6 text-teal-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-gray-900">Need layout or presentation structural support?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                CreackEduHelp specialists can format your literature references, optimize PowerPoint animations, and edit templates to match compliance rules. Create an account to request quotes.
              </p>
              <div className="pt-2">
                <Link href="/register" className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition">
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
