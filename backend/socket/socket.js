import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Message from "../models/message.model.js";

// Load env vars BEFORE anything that needs them
dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
	"http://localhost:3000",
	process.env.CLIENT_URL,
].filter(Boolean);

const io = new Server(server, {
	cors: {
		origin: (origin, callback) => {
			// Allow same-origin requests (no origin header) or whitelisted origins
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error("Not allowed by CORS"));
			}
		},
		methods: ["GET", "POST"],
		credentials: true,
	},
	pingTimeout: 60000,
});

// ─── In-memory user → socketId map ─────────────────────────────
const userSocketMap = {}; // { userId: socketId }

export const getReceiverSocketId = (receiverId) => {
	return userSocketMap[receiverId];
};

export const isUserOnline = (userId) => {
	return !!userSocketMap[userId];
};

// ─── Socket.io JWT Authentication Middleware ────────────────────
io.use((socket, next) => {
	try {
		const token = socket.handshake.auth?.token;
		if (!token) {
			return next(new Error("Authentication error: No token provided"));
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		if (!decoded?.userId) {
			return next(new Error("Authentication error: Invalid token"));
		}

		socket.userId = decoded.userId;
		next();
	} catch (error) {
		console.error("Socket auth error:", error.message);
		next(new Error("Authentication error: Token verification failed"));
	}
});

// ─── Connection Handler ─────────────────────────────────────────
io.on("connection", (socket) => {
	const userId = socket.userId;
	console.log(`User connected: ${userId} (socket: ${socket.id})`);

	userSocketMap[userId] = socket.id;
	socket.join(userId);

	// Broadcast updated online users to everyone
	io.emit("getOnlineUsers", Object.keys(userSocketMap));

	// Mark pending messages as delivered
	markPendingMessagesAsDelivered(userId);

	// ─── Typing Indicators ────────────────────────────────────
	socket.on("typing", ({ receiverId }) => {
		if (userSocketMap[receiverId]) {
			io.to(receiverId).emit("userTyping", { senderId: userId });
		}
	});

	socket.on("stopTyping", ({ receiverId }) => {
		if (userSocketMap[receiverId]) {
			io.to(receiverId).emit("userStopTyping", { senderId: userId });
		}
	});

	// ─── Message Seen ─────────────────────────────────────────
	socket.on("messagesSeen", async ({ senderId }) => {
		try {
			await Message.updateMany(
				{ senderId, receiverId: userId, status: { $ne: "seen" } },
				{ $set: { status: "seen" } }
			);
			if (userSocketMap[senderId]) {
				io.to(senderId).emit("messagesSeen", { by: userId });
			}
		} catch (error) {
			console.error("Error marking messages as seen:", error.message);
		}
	});

	// ─── Disconnect ───────────────────────────────────────────
	socket.on("disconnect", () => {
		console.log(`User disconnected: ${userId}`);
		delete userSocketMap[userId];
		io.emit("getOnlineUsers", Object.keys(userSocketMap));
	});
});

// ─── Helper: Mark undelivered messages as "delivered" ───────────
async function markPendingMessagesAsDelivered(userId) {
	try {
		const result = await Message.updateMany(
			{ receiverId: userId, status: "sent" },
			{ $set: { status: "delivered" } }
		);
		if (result.modifiedCount > 0) {
			const senderIds = await Message.find({
				receiverId: userId,
				status: "delivered",
			}).distinct("senderId");

			senderIds.forEach((senderId) => {
				if (userSocketMap[senderId.toString()]) {
					io.to(senderId.toString()).emit("messagesDelivered", { to: userId });
				}
			});
		}
	} catch (error) {
		console.error("Error marking messages as delivered:", error.message);
	}
}

export { app, io, server };
