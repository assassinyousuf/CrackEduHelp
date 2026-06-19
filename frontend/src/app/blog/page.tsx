"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, BlogPost } from "@/lib/api";
import { BookOpen, Calendar, ArrowRight, Mail, Sparkles } from "lucide-react";

export default function BlogListingPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsSuccess, setNewsSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await api.getPosts();
      setPosts(data);
    } catch (err) {
      console.error("Failed to load blog posts", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    try {
      await api.submitLead({
        type: "newsletter",
        email: newsletterEmail
      });
      setNewsSuccess(true);
      setNewsletterEmail("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Banner Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full border border-teal-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CreackEduHelp Academy Blog</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 leading-tight">Academic Resource Center & Study Guides</h1>
          <p className="text-sm text-slate-500">
            Discover referencing templates, slide structure guides, and study time-blocking strategies curated by our university specialists.
          </p>
        </div>

        {/* Blog Posts Grid */}
        {loading ? (
          <div className="text-center py-10 text-slate-400">Fetching reading articles...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-4">
                  <span className="inline-block px-2.5 py-1 bg-teal-50 text-teal-700 font-extrabold text-[10px] uppercase rounded border border-teal-100">
                    {post.category}
                  </span>
                  <h3 className="font-extrabold text-lg text-gray-900 leading-snug">{post.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed truncate-3-lines">
                    {post.content.slice(0, 150)}...
                  </p>
                </div>
                
                <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-50 text-xs text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </span>
                  <Link 
                    href={`/blog/${post.slug}`}
                    className="font-bold text-teal-600 hover:text-teal-700 flex items-center space-x-1"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Newsletter widget */}
        <div className="bg-slate-900 text-white rounded-2xl p-8 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between border border-slate-800 gap-6 mt-12">
          <div className="space-y-2">
            <h3 className="font-extrabold text-xl">Get Study Guides in Your Inbox</h3>
            <p className="text-xs text-slate-400">We send referencing checklists and citation templates once a month. No spam.</p>
          </div>

          <form onSubmit={handleSubscribe} className="w-full md:w-auto flex gap-2 shrink-0">
            {newsSuccess ? (
              <span className="text-sm font-semibold text-teal-400">Subscription complete! Thank you.</span>
            ) : (
              <>
                <input 
                  type="email" required value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 w-full sm:w-64"
                  placeholder="enter your email address"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs rounded-lg transition flex items-center space-x-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Subscribe</span>
                </button>
              </>
            )}
          </form>
        </div>

      </div>
    </div>
  );
}
