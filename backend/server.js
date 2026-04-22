import path from "path";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";
import errorHandler from "./middleware/errorHandler.js";

import connectToMongoDB from "./db/connectToMongoDB.js";
import { app, server } from "./socket/socket.js";

dotenv.config();

// ─── Validate required env vars ────────────────────────────────
const requiredEnvVars = ["JWT_SECRET", "MONGO_DB_URI"];
for (const envVar of requiredEnvVars) {
	if (!process.env[envVar]) {
		console.error(`FATAL: Missing required environment variable: ${envVar}`);
		process.exit(1);
	}
}

const __dirname = path.resolve();
const PORT = process.env.PORT || 5000;

// ─── Middleware ─────────────────────────────────────────────────
const allowedOrigins = [
	"http://localhost:3000",
	process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
	origin: (origin, callback) => {
		if (!origin || allowedOrigins.includes(origin)) {
			callback(null, true);
		} else {
			callback(new Error("Not allowed by CORS"));
		}
	},
	credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ─── Routes ────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

// ─── Serve uploaded files ──────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "backend/uploads")));

// ─── Serve frontend in production ──────────────────────────────
app.use(express.static(path.join(__dirname, "/frontend/dist")));
app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

// ─── Global error handler (must be last) ───────────────────────
app.use(errorHandler);

// ─── Start server AFTER DB connection ──────────────────────────
async function start() {
	try {
		await connectToMongoDB();
		server.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Failed to start server:", error.message);
		process.exit(1);
	}
}

start();
