import express from "express";
import rateLimit from "express-rate-limit";
import { login, logout, signup } from "../controllers/auth.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

// Rate limit auth endpoints: 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	message: { error: "Too many attempts, please try again after 15 minutes" },
	standardHeaders: true,
	legacyHeaders: false,
});

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout", protectRoute, logout);

export default router;
