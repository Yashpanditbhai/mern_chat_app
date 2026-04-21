import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io, isUserOnline } from "../socket/socket.js";
import { getFileType } from "../middleware/upload.js";

export const sendMessage = async (req, res) => {
	try {
		const { message } = req.body;
		const { id: receiverId } = req.params;
		const senderId = req.user._id;
		const file = req.file; // From multer

		// ─── Validation ────────────────────────────────────
		const hasText = message && typeof message === "string" && message.trim().length > 0;
		const hasFile = !!file;

		if (!hasText && !hasFile) {
			return res.status(400).json({ error: "Message or file is required" });
		}

		if (hasText && message.length > 5000) {
			return res.status(400).json({ error: "Message too long (max 5000 characters)" });
		}

		if (senderId.toString() === receiverId) {
			return res.status(400).json({ error: "Cannot send message to yourself" });
		}

		const receiverUser = await User.findById(receiverId);
		if (!receiverUser) {
			return res.status(404).json({ error: "Receiver not found" });
		}

		// ─── Find or create conversation ───────────────────
		let conversation = await Conversation.findOne({
			participants: { $all: [senderId, receiverId] },
		});

		if (!conversation) {
			conversation = await Conversation.create({
				participants: [senderId, receiverId],
			});
		}

		const initialStatus = isUserOnline(receiverId) ? "delivered" : "sent";

		// ─── Build message object ──────────────────────────
		const messageData = {
			senderId,
			receiverId,
			message: hasText ? message.trim() : "",
			status: initialStatus,
		};

		if (hasFile) {
			messageData.file = {
				url: `/uploads/${file.filename}`,
				name: file.originalname,
				type: getFileType(file.mimetype),
				mimeType: file.mimetype,
				size: file.size,
			};
		}

		const newMessage = new Message(messageData);

		// Update conversation
		conversation.messages.push(newMessage._id);

		const previewText = hasFile
			? `${hasText ? message.trim().substring(0, 50) : getFileType(file.mimetype) === "image" ? "Photo" : "File"}`
			: message.trim().substring(0, 100);

		conversation.lastMessage = {
			text: previewText,
			senderId,
			createdAt: new Date(),
		};

		await Promise.all([conversation.save(), newMessage.save()]);

		// ─── Real-time delivery ────────────────────────────
		const receiverSocketId = getReceiverSocketId(receiverId);
		if (receiverSocketId) {
			io.to(receiverId).emit("newMessage", {
				...newMessage.toJSON(),
				conversationId: conversation._id,
			});
		}

		res.status(201).json(newMessage);
	} catch (error) {
		console.error("Error in sendMessage controller:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getMessages = async (req, res) => {
	try {
		const { id: userToChatId } = req.params;
		const senderId = req.user._id;
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 50;

		const conversation = await Conversation.findOne({
			participants: { $all: [senderId, userToChatId] },
		});

		if (!conversation) return res.status(200).json({ messages: [], hasMore: false });

		const totalMessages = conversation.messages.length;
		const totalPages = Math.ceil(totalMessages / limit);
		const skip = Math.max(0, totalMessages - page * limit);

		await conversation.populate({
			path: "messages",
			options: {
				skip,
				limit,
				sort: { createdAt: 1 },
			},
		});

		await Message.updateMany(
			{ senderId: userToChatId, receiverId: senderId, status: { $ne: "seen" } },
			{ $set: { status: "seen" } }
		);

		const senderSocketId = getReceiverSocketId(userToChatId);
		if (senderSocketId) {
			io.to(userToChatId).emit("messagesSeen", { by: senderId.toString() });
		}

		res.status(200).json({
			messages: conversation.messages,
			hasMore: page < totalPages,
			currentPage: page,
			totalPages,
		});
	} catch (error) {
		console.error("Error in getMessages controller:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
