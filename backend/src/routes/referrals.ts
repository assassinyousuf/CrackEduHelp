import { Router } from "express";
import { AmbassadorProfile, Referral, User } from "../models/models.js";
import { authenticateJWT, requireRoles } from "../middleware/auth.js";

const router = Router();

router.get("/profile", authenticateJWT, requireRoles(["ambassador"]), async (req, res) => {
  try {
    const profile = await AmbassadorProfile.findOne({ where: { user_id: req.user!.id } });
    if (!profile) {
      return res.status(404).json({ detail: "Ambassador profile not initialized" });
    }
    return res.json(profile);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ detail: err.message || "Failed to load ambassador profile" });
  }
});

router.get("/stats", authenticateJWT, requireRoles(["ambassador"]), async (req, res) => {
  try {
    const profile = await AmbassadorProfile.findOne({ where: { user_id: req.user!.id } });
    if (!profile) {
      return res.status(404).json({ detail: "Ambassador profile not found" });
    }

    const referrals = await Referral.findAll({
      where: { ambassador_id: req.user!.id },
      include: [
        { model: User, as: "referred_user", attributes: { exclude: ["hashed_password"] } }
      ]
    });

    const registrations = referrals.length;
    const converted = referrals.filter(r => r.status === "order_placed" || r.status === "paid").length;
    const simulatedClicks = registrations * 4 + 12;

    const totalEarnings = referrals.reduce((sum, r) => sum + Number(r.commission_earned), 0);

    return res.json({
      clicks: simulatedClicks,
      registrations,
      converted_orders: converted,
      total_earnings: Number(totalEarnings.toFixed(2)),
      current_balance: Number(Number(profile.balance).toFixed(2)),
      referrals
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ detail: err.message || "Failed to compute statistics" });
  }
});

export default router;
