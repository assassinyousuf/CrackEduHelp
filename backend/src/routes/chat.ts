import { Router } from "express";
import { ChatMessage, Order, User } from "../models/models.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = Router();

router.get("/:order_id", authenticateJWT, async (req, res) => {
  try {
    const { role, id: userId } = req.user!;
    const orderId = req.params.order_id;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ detail: "Order not found" });
    }

    if (role === "student" && order.student_id !== userId) {
      return res.status(403).json({ detail: "Not authorized to access this thread" });
    }
    if (role === "specialist" && order.specialist_id !== userId) {
      return res.status(403).json({ detail: "Not authorized to access this thread" });
    }

    const messages = await ChatMessage.findAll({
      where: { order_id: orderId },
      include: [
        { model: User, as: "sender", attributes: { exclude: ["hashed_password"] } }
      ],
      order: [["created_at", "ASC"]]
    });

    return res.json(messages);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ detail: err.message || "Failed to load chat history" });
  }
});

router.post("/:order_id", authenticateJWT, async (req, res) => {
  try {
    const { role, id: userId } = req.user!;
    const orderId = req.params.order_id;
    const { message_text, attachment_key } = req.body;

    if (!message_text) {
      return res.status(400).json({ detail: "Message text is required" });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ detail: "Order not found" });
    }

    if (role === "student" && order.student_id !== userId) {
      return res.status(403).json({ detail: "Not authorized to message in this thread" });
    }
    if (role === "specialist" && order.specialist_id !== userId) {
      return res.status(403).json({ detail: "Not authorized to message in this thread" });
    }

    const msg = await ChatMessage.create({
      order_id: orderId,
      sender_id: userId,
      message_text,
      attachment_key: attachment_key || null
    });

    const msgWithSender = await ChatMessage.findByPk(msg.id, {
      include: [
        { model: User, as: "sender", attributes: { exclude: ["hashed_password"] } }
      ]
    });

    return res.status(201).json(msgWithSender);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ detail: err.message || "Failed to send message" });
  }
});

export default router;
