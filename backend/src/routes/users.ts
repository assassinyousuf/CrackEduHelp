import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.js";
import { getUserResponse } from "./auth.js";

const router = Router();

router.get("/me", authenticateJWT, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ detail: "Not authenticated" });
  }
  return res.json(getUserResponse(req.user));
});

export default router;
