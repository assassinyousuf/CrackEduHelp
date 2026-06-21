import { Router } from "express";
import multer from "multer";
import unixcrypt from "@bonniernews/unixcrypt-js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { User, AmbassadorProfile, Referral, AuditLog } from "../models/models.js";
import { FileService } from "../services/files.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_for_creackeduhelp_2026";
const ACCESS_TOKEN_EXPIRE_MINUTES = Number(process.env.ACCESS_TOKEN_EXPIRE_MINUTES) || 60 * 24;

// Helper to exclude password
export function getUserResponse(user: User) {
  const data = user.get({ plain: true });
  delete data.hashed_password;
  return data;
}

router.post("/register", upload.single("profile_picture"), async (req, res) => {
  try {
    const {
      email,
      password,
      full_name,
      role,
      phone,
      university,
      whatsapp,
      facebook_link,
      linkedin_link,
      referral_code
    } = req.body;

    if (!email || !password || !full_name || !role || !phone) {
      return res.status(422).json({ detail: "Missing required fields (email, password, full_name, role, phone)" });
    }

    if (role !== "student" && role !== "ambassador") {
      return res.status(400).json({ detail: "Self-registration is only allowed for 'student' or 'ambassador' roles." });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ detail: "Email address already registered." });
    }

    let profilePictureKey: string | null = null;
    if (req.file) {
      const uploadRes = await FileService.saveFile(req.file, "avatars");
      if (uploadRes.isClean) {
        profilePictureKey = uploadRes.relativeKey;
      }
    }

    const hashedPassword = unixcrypt.encrypt(password);
    const userId = uuidv4();

    const user = await User.create({
      id: userId,
      email,
      hashed_password: hashedPassword,
      full_name,
      role,
      phone,
      university: role === "student" ? university : null,
      whatsapp: whatsapp || null,
      facebook_link: facebook_link || null,
      linkedin_link: linkedin_link || null,
      profile_picture: profilePictureKey,
      is_active: true,
    });

    if (role === "ambassador") {
      const refCode = `REF-${uuidv4().slice(0, 8).toUpperCase()}`;
      await AmbassadorProfile.create({
        user_id: userId,
        referral_code: refCode,
        referral_url: `/register?ref=${refCode}`,
        commission_rate: 10.0,
        balance: 0.0
      });
    } else if (role === "student" && referral_code) {
      const ambassador = await AmbassadorProfile.findOne({ where: { referral_code } });
      if (ambassador) {
        await Referral.create({
          ambassador_id: ambassador.user_id,
          referred_user_id: userId,
          status: "registered",
          commission_earned: 0.0
        });
      }
    }

    await AuditLog.create({
      user_id: userId,
      action: "user_registration",
      details: `Registered as role: ${role}`
    });

    return res.status(201).json(getUserResponse(user));
  } catch (err: any) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ detail: err.message || "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ detail: "Missing email or password" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ detail: "Incorrect email or password." });
    }

    const isMatch = unixcrypt.verify(password, user.hashed_password);
    if (!isMatch) {
      return res.status(401).json({ detail: "Incorrect email or password." });
    }

    if (!user.is_active) {
      return res.status(400).json({ detail: "Your account has been deactivated." });
    }

    const token = jwt.sign({ sub: user.id }, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRE_MINUTES * 60
    });

    await AuditLog.create({
      user_id: user.id,
      action: "user_login",
      details: "Successfully logged in"
    });

    return res.json({
      access_token: token,
      token_type: "bearer",
      user: getUserResponse(user)
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ detail: err.message || "Login failed" });
  }
});

export default router;
