import { Router } from "express";
import { Order, User, Payment, AmbassadorProfile, AuditLog } from "../models/models.js";
import { authenticateJWT, requireRoles } from "../middleware/auth.js";
import { getUserResponse } from "./auth.js";

const router = Router();

router.get("/stats", authenticateJWT, requireRoles(["admin"]), async (req, res) => {
  try {
    const totalOrders = await Order.count();
    const pendingOrders = await Order.count({ where: { status: "submitted" } });
    const activeSpecialists = await User.count({ where: { role: "specialist", is_active: true } });

    const approvedPayments = await Payment.findAll({ where: { status: "approved" } });
    const totalRevenue = approvedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const profiles = await AmbassadorProfile.findAll();
    const referralPayoutLiability = profiles.reduce((sum, p) => sum + Number(p.balance), 0);

    const activeUsers = await User.count({ where: { is_active: true } });

    return res.json({
      total_orders: totalOrders,
      pending_orders: pendingOrders,
      active_specialists: activeSpecialists,
      total_revenue: Number(totalRevenue.toFixed(2)),
      referral_payout_liability: Number(referralPayoutLiability.toFixed(2)),
      active_users: activeUsers
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ detail: err.message || "Failed to load admin stats" });
  }
});

router.post("/orders/:order_id/override", authenticateJWT, requireRoles(["admin"]), async (req, res) => {
  try {
    const adminId = req.user!.id;
    const orderId = req.params.order_id;
    const { quote_amount } = req.body;

    if (!quote_amount || isNaN(Number(quote_amount))) {
      return res.status(400).json({ detail: "Valid quote_amount is required" });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ detail: "Order not found" });
    }

    const quoteVal = Number(quote_amount);
    const deposit = Number((quoteVal * 0.30).toFixed(2));
    const balance = Number((quoteVal - deposit).toFixed(2));

    order.quote_amount = quoteVal;
    order.deposit_amount = deposit;
    order.final_amount = balance;
    order.admin_override_quote = true;
    order.status = "quoted";
    await order.save();

    await AuditLog.create({
      user_id: adminId,
      action: "order_quote_override",
      details: `Overrode order ${orderId} quote to £${quoteVal.toFixed(2)}`
    });

    const fullOrder = await Order.findByPk(orderId, {
      include: [
        { model: User, as: "student", attributes: { exclude: ["hashed_password"] } },
        { model: User, as: "specialist", attributes: { exclude: ["hashed_password"] } }
      ]
    });

    return res.json(fullOrder);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ detail: err.message || "Override failed" });
  }
});

router.post("/orders/:order_id/assign/:specialist_id", authenticateJWT, requireRoles(["admin"]), async (req, res) => {
  try {
    const adminId = req.user!.id;
    const { order_id, specialist_id } = req.params;

    const order = await Order.findByPk(order_id);
    if (!order) {
      return res.status(404).json({ detail: "Order not found" });
    }

    const specialist = await User.findOne({ where: { id: specialist_id, role: "specialist" } });
    if (!specialist) {
      return res.status(404).json({ detail: "Specialist not found" });
    }

    order.specialist_id = specialist.id;
    order.status = "assigned";
    await order.save();

    await AuditLog.create({
      user_id: adminId,
      action: "order_specialist_assigned",
      details: `Assigned specialist ${specialist_id} to order ${order_id}`
    });

    const fullOrder = await Order.findByPk(order_id, {
      include: [
        { model: User, as: "student", attributes: { exclude: ["hashed_password"] } },
        { model: User, as: "specialist", attributes: { exclude: ["hashed_password"] } }
      ]
    });

    return res.json(fullOrder);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ detail: err.message || "Assignment failed" });
  }
});

router.get("/specialists", authenticateJWT, requireRoles(["admin"]), async (req, res) => {
  try {
    const specs = await User.findAll({
      where: { role: "specialist", is_active: true }
    });
    return res.json(specs.map(getUserResponse));
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ detail: err.message || "Failed to load specialists" });
  }
});

router.get("/users", authenticateJWT, requireRoles(["admin"]), async (req, res) => {
  try {
    const users = await User.findAll();
    return res.json(users.map(getUserResponse));
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ detail: err.message || "Failed to load users" });
  }
});

export default router;
