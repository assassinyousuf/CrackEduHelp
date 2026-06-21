import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/models.js";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_for_creackeduhelp_2026";

// Extend Express Request type to include req.user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ detail: "Authentication token is missing. Please log in first." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    if (!payload || !payload.sub) {
      return res.status(401).json({ detail: "Could not validate credentials" });
    }

    const user = await User.findByPk(payload.sub);
    if (!user) {
      return res.status(401).json({ detail: "Could not validate credentials" });
    }

    if (!user.is_active) {
      return res.status(400).json({ detail: "Inactive user account" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ detail: "Could not validate credentials" });
  }
}

export function requireRoles(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ detail: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        detail: `Operation restricted. Allowed roles: ${allowedRoles.join(", ")}`
      });
    }

    next();
  };
}
