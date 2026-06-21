import { Router } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { Order, OrderFile, User, AuditLog, Referral, Payment } from "../models/models.js";
import { authenticateJWT, requireRoles } from "../middleware/auth.js";
import { calculateQuote } from "../services/pricing.js";
import { FileService } from "../services/files.js";
import { NotificationService } from "../services/notifications.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

const PROHIBITED_KEYWORDS = [
  "exam", "quiz", "test", "cheat", "impersonate", "credential",
  "take my", "write my exam", "do my exam", "live test", "midterm", "final exam"
];

// Helper to fetch order with full relations
async function fetchFullOrder(orderId: string) {
  return await Order.findByPk(orderId, {
    include: [
      { model: OrderFile, as: "files" },
      { model: User, as: "student", attributes: { exclude: ["hashed_password"] } },
      { model: User, as: "specialist", attributes: { exclude: ["hashed_password"] } },
      { model: Payment, as: "payments" }
    ]
  });
}

router.post("/estimate", async (req, res) => {
  try {
    const { service_type, word_count, slide_count, priority_level } = req.body;
    if (!service_type) {
      return res.status(400).json({ detail: "Missing service_type" });
    }
    const estimation = await calculateQuote({
      service_type,
      word_count: Number(word_count || 0),
      slide_count: Number(slide_count || 0),
      priority_level: priority_level || "standard"
    });
    return res.json(estimation);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ detail: err.message || "Estimation failed" });
  }
});

router.post("", authenticateJWT, requireRoles(["student"]), async (req, res) => {
  try {
    const studentId = req.user!.id;
    const {
      title,
      university,
      course_name,
      service_type,
      task_description,
      word_count,
      slide_count,
      deadline,
      priority_level
    } = req.body;

    if (!title || !university || !course_name || !service_type || !task_description || !deadline) {
      return res.status(400).json({ detail: "Missing required order parameters." });
    }

    // Ethical Compliance validation
    const descLower = task_description.toLowerCase();
    for (const kw of PROHIBITED_KEYWORDS) {
      if (descLower.includes(kw)) {
        return res.status(422).json({
          detail: `Warning: Task description contains references to prohibited academic services ('${kw}'). CreackEduHelp does not assist with live testing, academic impersonation, or exam cheating.`
        });
      }
    }

    // Calculate initial quote
    const estimation = await calculateQuote({
      service_type,
      word_count: Number(word_count || 0),
      slide_count: Number(slide_count || 0),
      priority_level: priority_level || "standard"
    });

    const orderId = uuidv4();
    const order = await Order.create({
      id: orderId,
      student_id: studentId,
      title,
      university,
      course_name,
      service_type,
      task_description,
      word_count: word_count ? Number(word_count) : null,
      slide_count: slide_count ? Number(slide_count) : null,
      deadline: new Date(deadline),
      priority_level: priority_level || "standard",
      status: "submitted",
      quote_amount: estimation.estimated_total,
      deposit_amount: estimation.deposit_required,
      final_amount: estimation.final_balance,
      admin_override_quote: false
    });

    // Track conversion referral status
    const ref = await Referral.findOne({ where: { referred_user_id: studentId } });
    if (ref && ref.status === "registered") {
      ref.status = "order_placed";
      await ref.save();
    }

    // Log order placement
    await AuditLog.create({
      user_id: studentId,
      action: "order_create",
      details: `Created order: ${order.id} under service: ${service_type}`
    });

    // Dispatch notification
    NotificationService.notifyOrderStatusChange(
      req.user!.email,
      orderId,
      "Submitted",
      `/student/orders/${orderId}`
    );

    const fullOrder = await fetchFullOrder(orderId);
    return res.status(201).json(fullOrder);
  } catch (err: any) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ detail: err.message || "Failed to create order" });
  }
});

router.get("", authenticateJWT, async (req, res) => {
  try {
    const { role, id: userId } = req.user!;
    const filter: any = {};

    if (role === "student") {
      filter.student_id = userId;
    } else if (role === "specialist") {
      filter.specialist_id = userId;
    }
    // Admins see all. Ambassadors shouldn't call this.

    const orders = await Order.findAll({
      where: filter,
      include: [
        { model: OrderFile, as: "files" },
        { model: User, as: "student", attributes: { exclude: ["hashed_password"] } },
        { model: User, as: "specialist", attributes: { exclude: ["hashed_password"] } },
        { model: Payment, as: "payments" }
      ],
      order: [["created_at", "DESC"]]
    });

    return res.json(orders);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ detail: err.message || "Failed to list orders" });
  }
});

router.get("/:order_id", authenticateJWT, async (req, res) => {
  try {
    const { role, id: userId } = req.user!;
    const orderId = req.params.order_id;

    const order = await fetchFullOrder(orderId);
    if (!order) {
      return res.status(404).json({ detail: "Order not found" });
    }

    // Authorization checks
    if (role === "student" && order.student_id !== userId) {
      return res.status(403).json({ detail: "Not authorized to access this order" });
    }
    if (role === "specialist" && order.specialist_id !== userId) {
      return res.status(403).json({ detail: "Not assigned to this order" });
    }

    return res.json(order);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ detail: err.message || "Failed to retrieve order details" });
  }
});

router.put("/:order_id", authenticateJWT, async (req, res) => {
  try {
    const { role, id: userId } = req.user!;
    const orderId = req.params.order_id;
    const { status: newStatus, title, task_description } = req.body;

    const order = await Order.findByPk(orderId, {
      include: [{ model: User, as: "student" }]
    });
    if (!order) {
      return res.status(404).json({ detail: "Order not found" });
    }

    if (role === "student" && order.student_id !== userId) {
      return res.status(403).json({ detail: "Access denied" });
    }
    if (role === "specialist" && order.specialist_id !== userId) {
      return res.status(403).json({ detail: "Access denied" });
    }

    const oldStatus = order.status;
    if (newStatus) {
      if (role === "student") {
        if (newStatus !== "revision_requested" && newStatus !== "cancelled") {
          return res.status(400).json({ detail: "Invalid status transition for student" });
        }
      } else if (role === "specialist") {
        if (newStatus !== "in_progress" && newStatus !== "draft_submitted" && newStatus !== "final_review") {
          return res.status(400).json({ detail: "Invalid status transition for specialist" });
        }
      }

      order.status = newStatus;

      await AuditLog.create({
        user_id: userId,
        action: "order_status_update",
        details: `Order status changed from ${oldStatus} to ${newStatus}`
      });

      NotificationService.notifyOrderStatusChange(
        order.student.email,
        order.id,
        newStatus,
        `/orders/${order.id}`
      );
    }

    if (title) order.title = title;
    if (task_description) order.task_description = task_description;

    order.updated_at = new Date();
    await order.save();

    const fullOrder = await fetchFullOrder(orderId);
    return res.json(fullOrder);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ detail: err.message || "Failed to update order" });
  }
});

router.post("/:order_id/files", authenticateJWT, upload.single("file"), async (req, res) => {
  try {
    const { role, id: userId } = req.user!;
    const orderId = req.params.order_id;
    const { file_category } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ detail: "Order not found" });
    }

    if (role === "student" && order.student_id !== userId) {
      return res.status(403).json({ detail: "Unauthorized" });
    }
    if (role === "specialist" && order.specialist_id !== userId) {
      return res.status(403).json({ detail: "Unauthorized" });
    }

    if (role === "specialist" && file_category !== "draft" && file_category !== "final") {
      return res.status(400).json({ detail: "Specialists can only upload 'draft' or 'final' files." });
    }

    if (!req.file) {
      return res.status(400).json({ detail: "No file uploaded" });
    }

    const subfolder = `orders/${orderId}`;
    const uploadRes = await FileService.saveFile(req.file, subfolder);

    const orderFile = await OrderFile.create({
      id: uuidv4(),
      order_id: orderId,
      uploaded_by: userId,
      file_name: req.file.originalname,
      file_key: uploadRes.relativeKey,
      file_size: uploadRes.sizeBytes,
      file_type: req.file.mimetype || "application/octet-stream",
      file_category,
      is_clean: uploadRes.isClean
    });

    if (file_category === "final" && role === "specialist") {
      order.status = "final_review";
      await order.save();
    } else if (file_category === "draft" && role === "specialist") {
      order.status = "draft_submitted";
      await order.save();
    }

    await AuditLog.create({
      user_id: userId,
      action: "file_upload",
      details: `Uploaded ${req.file.originalname} as category ${file_category}`
    });

    return res.json(orderFile);
  } catch (err: any) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ detail: err.message || "Failed to upload file" });
  }
});

router.get("/files/:file_id/download", authenticateJWT, async (req, res) => {
  try {
    const { role, id: userId } = req.user!;
    const fileId = req.params.file_id;

    const orderFile = await OrderFile.findByPk(fileId, {
      include: [{ model: Order, as: "order", include: [{ model: Payment, as: "payments" }] }]
    });
    if (!orderFile) {
      return res.status(404).json({ detail: "File not found" });
    }

    const order = orderFile.order;
    if (role === "student" && order.student_id !== userId) {
      return res.status(403).json({ detail: "Access denied" });
    }
    if (role === "specialist" && order.specialist_id !== userId) {
      return res.status(403).json({ detail: "Access denied" });
    }

    // Business rule: Student cannot download final files until payment is approved/completed
    if (role === "student" && orderFile.file_category === "final") {
      const hasApprovedFinalPayment = order.payments?.some(
        (p: any) => p.payment_type === "final" && p.status === "approved"
      );
      const isFree = Number(order.final_amount) === 0;

      if (!hasApprovedFinalPayment && !isFree && order.status !== "completed") {
        return res.status(402).json({
          detail: "Final delivery is locked. Please submit the final payment first."
        });
      }
    }

    const filePath = FileService.getFilePath(orderFile.file_key);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ detail: "Physical file storage not found" });
    }

    await AuditLog.create({
      user_id: userId,
      action: "file_download",
      details: `Downloaded file: ${orderFile.file_name} from order ${order.id}`
    });

    return res.download(filePath, orderFile.file_name);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ detail: err.message || "Download failed" });
  }
});

export default router;
