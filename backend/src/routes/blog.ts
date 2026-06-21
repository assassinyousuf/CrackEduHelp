import { Router } from "express";
import { BlogPost, LeadCapture, AuditLog } from "../models/models.js";

const router = Router();

const MOCK_POSTS = [
  {
    title: "Mastering Harvard Referencing: A Step-by-Step Guide",
    slug: "mastering-harvard-referencing",
    content: "Accurate citations form the cornerstone of academic report writing. In this guide, we break down standard book, journal, and web formatting systems to elevate your citation structure...",
    category: "Referencing Guides"
  },
  {
    title: "Sleek Slide Layouts: Design Hacks for Presentation Design",
    slug: "sleek-slide-layouts-design-hacks",
    content: "Visual communication is key. Learn how to implement clear layout margins, limit text blocks, choose modern typography colors (like charcoal and teal), and design layouts that command attention.",
    category: "Presentation Skills"
  },
  {
    title: "Boost Your Focus: Time-Blocking for Academic Productivity",
    slug: "time-blocking-academic-productivity",
    content: "Discover how organizing study hours into dedicated 50-minute task blocks improves retention, mitigates exam stress, and helps you deliver academic reports on schedule.",
    category: "Productivity"
  }
];

router.get("", async (req, res) => {
  try {
    let posts = await BlogPost.findAll({ where: { published: true } });
    if (posts.length === 0) {
      for (const p of MOCK_POSTS) {
        await BlogPost.create({
          title: p.title,
          slug: p.slug,
          content: p.content,
          category: p.category,
          published: true
        });
      }
      posts = await BlogPost.findAll({ where: { published: true } });
    }
    return res.json(posts);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ detail: err.message || "Failed to load articles" });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const post = await BlogPost.findOne({
      where: { slug: req.params.slug, published: true }
    });
    if (!post) {
      return res.status(404).json({ detail: "Article not found" });
    }
    return res.json(post);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ detail: err.message || "Failed to load article details" });
  }
});

router.post("/lead", async (req, res) => {
  try {
    const { type, email, phone, name, message } = req.body;
    if (!type || !email) {
      return res.status(400).json({ detail: "Missing required lead fields" });
    }

    const lead = await LeadCapture.create({
      type,
      email,
      phone: phone || null,
      name: name || null,
      message: message || null
    });

    await AuditLog.create({
      action: "lead_capture",
      details: `Captured lead type ${type} for email: ${email}`
    });

    return res.status(201).json(lead);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ detail: err.message || "Failed to capture lead" });
  }
});

export default router;
