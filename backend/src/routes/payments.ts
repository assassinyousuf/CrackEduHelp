import { Router } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { Payment, Order, Referral, AmbassadorProfile, AuditLog, User } from "../models/models.js";
import { authenticateJWT, requireRoles } from "../middleware/auth.js";
import { FileService } from "../services/files.js";
import { NotificationService } from "../services/notifications.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post("", authenticateJWT, requireRoles(["student"]), upload.single("proof"), async (req, res) => {
  try {
    const studentId = req.user!.id;
    const { order_id, amount, payment_type, payment_method } = req.body;

    if (!order_id || !amount || !payment_type || !payment_method) {
      return res.status(400).json({ detail: "Missing required payment fields" });
    }

    const order = await Order.findByPk(order_id);
    if (!order) {
      return res.status(404).json({ detail: "Order not found" });
    }

    if (order.student_id !== studentId) {
      return res.status(403).json({ detail: "Unauthorized" });
    }

    if (payment_type !== "deposit" && payment_type !== "final") {
      return res.status(400).json({ detail: "Payment type must be 'deposit' or 'final'" });
    }

    if (payment_method !== "bank_transfer" && payment_method !== "wise" && payment_method !== "paypal") {
      return res.status(400).json({ detail: "Invalid payment method" });
    }

    if (!req.file) {
      return res.status(400).json({ detail: "No payment proof file uploaded" });
    }

    // Save proof file
    const subfolder = `payments/${order_id}`;
    const uploadRes = await FileService.saveFile(req.file, subfolder);

    if (!uploadRes.isClean) {
      return res.status(400).json({ detail: "File verification failed. Please re-upload." });
    }

    const payment = await Payment.create({
      id: uuidv4(),
      order_id,
      student_id: studentId,
      amount: Number(amount),
      payment_type,
      payment_method,
      status: "pending",
      proof_file_key: uploadRes.relativeKey
    });

    await AuditLog.create({
      user_id: studentId,
      action: "payment_proof_submitted",
      details: `Submitted ${payment_type} payment of £${amount} for order ${order_id}`
    });

    return res.status(201).json(payment);
  } catch (err: any) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ detail: err.message || "Payment submission failed" });
  }
});

router.get("", authenticateJWT, async (req, res) => {
  try {
    const { role, id: userId } = req.user!;

    if (role === "admin") {
      const payments = await Payment.findAll({
        order: [["created_at", "DESC"]]
      });
      return res.json(payments);
    } else if (role === "student") {
      const payments = await Payment.findAll({
        where: { student_id: userId },
        order: [["created_at", "DESC"]]
      });
      return res.json(payments);
    }

    return res.status(403).json({ detail: "Unauthorized" });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ detail: err.message || "Failed to list payments" });
  }
});

router.post("/:payment_id/verify", authenticateJWT, requireRoles(["admin"]), async (req, res) => {
  try {
    const adminId = req.user!.id;
    const paymentId = req.params.payment_id;
    const { status } = req.body;

    if (!status || (status !== "approved" && status !== "rejected")) {
      return res.status(400).json({ detail: "Verify status must be 'approved' or 'rejected'" });
    }

    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      return res.status(404).json({ detail: "Payment record not found" });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({ detail: "Payment already processed" });
    }

    payment.status = status;
    payment.verified_by = adminId;
    payment.verified_at = new Date();
    await payment.save();

    const order = await Order.findByPk(payment.order_id, {
      include: [{ model: User, as: "student" }]
    });

    if (order && status === "approved") {
      if (payment.payment_type === "deposit") {
        order.status = "deposit_paid";
        await order.save();

        // Handle referral commission
        const ref = await Referral.findOne({ where: { referred_user_id: order.student_id } });
        if (ref && ref.status !== "paid") {
          ref.status = "paid";

          const ambassadorProfile = await AmbassadorProfile.findOne({
            where: { user_id: ref.ambassador_id }
          });
          if (ambassadorProfile) {
            const earned = Number(order.quote_amount || 0) * (Number(ambassadorProfile.commission_rate) / 100.0);
            ref.commission_earned = Number(earned.toFixed(2));
            await ref.save();

            ambassadorProfile.balance = Number((Number(ambassadorProfile.balance) + earned).toFixed(2));
            await ambassadorProfile.save();

            await AuditLog.create({
              user_id: ambassadorProfile.user_id,
              action: "referral_commission_credit",
              details: `Earned £${earned.toFixed(2)} referral bonus for student register: ${order.student_id}`
            });
          }
        }
      } else {
        // Final payment approved
        order.status = "completed";
        await order.save();
      }

      await AuditLog.create({
        user_id: adminId,
        action: "payment_approved",
        details: `Approved ${payment.payment_type} of £${payment.amount} for order ${order.id}`
      });

      NotificationService.notifyPaymentReceived(
        order.student.email,
        String(order.id),
        Number(payment.amount),
        payment.payment_type
      );
    } else if (order && status === "rejected") {
      await AuditLog.create({
        user_id: adminId,
        action: "payment_rejected",
        details: `Rejected ${payment.payment_type} for order ${order.id}`
      });
    }

    return res.json(payment);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ detail: err.message || "Verification failed" });
  }
});

export default router;
