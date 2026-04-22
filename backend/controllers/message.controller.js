import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io, isUserOnline } from "../socket/socket.js";
import { getFileType } from "../middleware/upload.js";

// ─── React to a message ────────────────────────────────────────
export const reactToMessage = async (req, res) => {
	try {
		const { messageId } = req.params;
		const { emoji } = req.body;
		const userId = req.user._id;

		if (!emoji) return res.status(400).json({ error: "Emoji is required" });

		const message = await Message.findById(messageId);
		if (!message) return res.status(404).json({ error: "Message not found" });

		// Toggle: remove if same emoji, otherwise add/update
		const existingIdx = message.reactions.findIndex(
			(r) => r.userId.toString() === userId.toString()
		);

		if (existingIdx !== -1) {
			if (message.reactions[existingIdx].emoji === emoji) {
				message.reactions.splice(existingIdx, 1); // Remove
			} else {
				message.reactions[existingIdx].emoji = emoji; // Update
			}
		} else {
			message.reactions.push({ userId, emoji });
		}

		await message.save();

		// Notify both sender and receiver
		const receiverId = message.senderId.toString() === userId.toString()
			? message.receiverId.toString()
			: message.senderId.toString();

		io.to(userId.toString()).emit("messageReaction", {
			messageId,
			reactions: message.reactions,
		});
		io.to(receiverId).emit("messageReaction", {
			messageId,
			reactions: message.reactions,
		});

		res.status(200).json({ reactions: message.reactions });
	} catch (error) {
		console.error("Error in reactToMessage:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

// ─── Delete message ─────────────────────────────────────────────
export const deleteMessage = async (req, res) => {
	try {
		const { messageId } = req.params;
		const { deleteForEveryone } = req.body;
		const userId = req.user._id;

		const message = await Message.findById(messageId);
		if (!message) return res.status(404).json({ error: "Message not found" });

		if (deleteForEveryone) {
			// Only sender can delete for everyone
			if (message.senderId.toString() !== userId.toString()) {
				return res.status(403).json({ error: "Only sender can delete for everyone" });
			}
			message.deletedForEveryone = true;
			message.message = "";
			message.file = undefined;
			await message.save();

			// Notify receiver
			const receiverId = message.receiverId.toString();
			io.to(receiverId).emit("messageDeleted", {
				messageId,
				deletedForEveryone: true,
			});
			io.to(userId.toString()).emit("messageDeleted", {
				messageId,
				deletedForEveryone: true,
			});
		} else {
			// Delete for me only
			if (!message.deletedFor) message.deletedFor = [];
			message.deletedFor.push(userId);
			await message.save();
		}

		res.status(200).json({ message: "Message deleted" });
	} catch (error) {
		console.error("Error in deleteMessage:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

// ─── Forward message ────────────────────────────────────────────
export const forwardMessage = async (req, res) => {
	try {
		const { messageId } = req.params;
		const { receiverIds } = req.body; // Array of user IDs to forward to
		const senderId = req.user._id;

		if (!receiverIds?.length) {
			return res.status(400).json({ error: "Select at least one recipient" });
		}

		const originalMessage = await Message.findById(messageId);
		if (!originalMessage) return res.status(404).json({ error: "Message not found" });

		const results = [];

		for (const receiverId of receiverIds) {
			let conversation = await Conversation.findOne({
				participants: { $all: [senderId, receiverId] },
				isGroupChat: { $ne: true },
			});

			if (!conversation) {
				conversation = await Conversation.create({
					participants: [senderId, receiverId],
				});
			}

			const newMessage = new Message({
				senderId,
				receiverId,
				message: originalMessage.message,
				file: originalMessage.file,
				status: isUserOnline(receiverId) ? "delivered" : "sent",
			});

			conversation.messages.push(newMessage._id);

			const previewText = originalMessage.file?.url
				? originalMessage.message?.trim() || "File"
				: originalMessage.message?.substring(0, 100);

			conversation.lastMessage = {
				text: previewText,
				senderId,
				createdAt: new Date(),
			};

			await Promise.all([conversation.save(), newMessage.save()]);

			const receiverSocketId = getReceiverSocketId(receiverId);
			if (receiverSocketId) {
				io.to(receiverId).emit("newMessage", {
					...newMessage.toJSON(),
					conversationId: conversation._id,
				});
			}

			results.push(newMessage);
		}

		res.status(201).json({ forwarded: results.length });
	} catch (error) {
		console.error("Error in forwardMessage:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

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

		// Check if sender is blocked by receiver
		if (receiverUser.blockedUsers && receiverUser.blockedUsers.some(
			(id) => id.toString() === senderId.toString()
		)) {
			return res.status(403).json({ error: "You are blocked by this user" });
		}

		// ─── Find or create conversation (exclude group chats) ───
		let conversation = await Conversation.findOne({
			participants: { $all: [senderId, receiverId] },
			isGroupChat: { $ne: true },
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

		// Reply support
		if (req.body.replyToId) {
			const replyMsg = await Message.findById(req.body.replyToId);
			if (replyMsg) {
				const replySender = await User.findById(replyMsg.senderId).select("fullName");
				messageData.replyTo = {
					messageId: replyMsg._id,
					text: replyMsg.message?.substring(0, 100) || (replyMsg.file?.url ? "File" : ""),
					senderName: replySender?.fullName || "",
				};
			}
		}

		if (hasFile) {
			messageData.file = {
				url: `/uploads/${file.filename}`,
				name: file.originalname,
				type: getFileType(file.mimetype),
				mimeType: file.mimetype,
				size: file.size,
			};
		}

		// Disappearing messages
		const disappearAfter = parseInt(req.body.disappearAfter);
		if (disappearAfter > 0) {
			messageData.expiresAt = new Date(Date.now() + disappearAfter * 1000);
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
			isGroupChat: { $ne: true },
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

// ─── Group Messages ────────────────────────────────────────────

export const sendGroupMessage = async (req, res) => {
	try {
		const { message } = req.body;
		const { conversationId } = req.params;
		const senderId = req.user._id;
		const file = req.file;

		const hasText = message && typeof message === "string" && message.trim().length > 0;
		const hasFile = !!file;

		if (!hasText && !hasFile) {
			return res.status(400).json({ error: "Message or file is required" });
		}

		const conversation = await Conversation.findById(conversationId);
		if (!conversation || !conversation.isGroupChat) {
			return res.status(404).json({ error: "Group not found" });
		}

		if (!conversation.participants.some((p) => p.toString() === senderId.toString())) {
			return res.status(403).json({ error: "Not a member of this group" });
		}

		// Check admin-only messaging
		if (conversation.settings?.onlyAdminsCanMessage) {
			const isAdmin = (conversation.admins || []).some((a) => a.toString() === senderId.toString())
				|| conversation.groupAdmin?.toString() === senderId.toString();
			if (!isAdmin) {
				return res.status(403).json({ error: "Only admins can send messages in this group" });
			}
		}

		const sender = await User.findById(senderId).select("fullName");

		const messageData = {
			senderId,
			receiverId: senderId, // placeholder for group messages
			message: hasText ? message.trim() : "",
			status: "delivered",
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
		conversation.messages.push(newMessage._id);

		const previewText = hasFile
			? hasText ? message.trim().substring(0, 50) : "File"
			: message.trim().substring(0, 100);

		conversation.lastMessage = {
			text: previewText,
			senderId,
			senderName: sender?.fullName || "",
			createdAt: new Date(),
		};

		await Promise.all([conversation.save(), newMessage.save()]);

		// Broadcast to all group members
		const messagePayload = {
			...newMessage.toJSON(),
			conversationId: conversation._id,
			senderName: sender?.fullName,
		};

		conversation.participants.forEach((participantId) => {
			if (participantId.toString() !== senderId.toString()) {
				io.to(participantId.toString()).emit("newGroupMessage", messagePayload);
			}
		});

		res.status(201).json(newMessage);
	} catch (error) {
		console.error("Error in sendGroupMessage:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getGroupMessages = async (req, res) => {
	try {
		const { conversationId } = req.params;
		const userId = req.user._id;

		const conversation = await Conversation.findById(conversationId);
		if (!conversation || !conversation.isGroupChat) {
			return res.status(404).json({ error: "Group not found" });
		}

		if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
			return res.status(403).json({ error: "Not a member of this group" });
		}

		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 50;
		const totalMessages = conversation.messages.length;
		const totalPages = Math.ceil(totalMessages / limit);
		const skip = Math.max(0, totalMessages - page * limit);

		await conversation.populate({
			path: "messages",
			options: { skip, limit, sort: { createdAt: 1 } },
			populate: { path: "senderId", select: "fullName profilePic" },
		});

		res.status(200).json({
			messages: conversation.messages,
			hasMore: page < totalPages,
			currentPage: page,
			totalPages,
		});
	} catch (error) {
		console.error("Error in getGroupMessages:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

// ─── Pin/Unpin message ─────────────────────────────────────────
export const pinMessage = async (req, res) => {
	try {
		const { messageId } = req.params;
		const message = await Message.findById(messageId);
		if (!message) return res.status(404).json({ error: "Message not found" });

		message.isPinned = !message.isPinned;
		await message.save();

		// Notify both users
		const otherId = message.senderId.toString() === req.user._id.toString()
			? message.receiverId.toString()
			: message.senderId.toString();

		io.to(req.user._id.toString()).emit("messagePinned", { messageId, isPinned: message.isPinned });
		io.to(otherId).emit("messagePinned", { messageId, isPinned: message.isPinned });

		res.status(200).json({ isPinned: message.isPinned });
	} catch (error) {
		console.error("Error in pinMessage:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

// ─── Star/Unstar message ───────────────────────────────────────
export const starMessage = async (req, res) => {
	try {
		const { messageId } = req.params;
		const userId = req.user._id;
		const message = await Message.findById(messageId);
		if (!message) return res.status(404).json({ error: "Message not found" });

		const idx = message.starredBy.findIndex((id) => id.toString() === userId.toString());
		if (idx !== -1) {
			message.starredBy.splice(idx, 1);
		} else {
			message.starredBy.push(userId);
		}
		await message.save();

		res.status(200).json({ starred: idx === -1 });
	} catch (error) {
		console.error("Error in starMessage:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

// ─── Get starred messages ──────────────────────────────────────
export const getStarredMessages = async (req, res) => {
	try {
		const userId = req.user._id;
		const messages = await Message.find({
			starredBy: userId,
			deletedForEveryone: { $ne: true },
		})
			.sort({ createdAt: -1 })
			.limit(100)
			.populate("senderId", "fullName profilePic")
			.populate("receiverId", "fullName profilePic");

		res.status(200).json(messages);
	} catch (error) {
		console.error("Error in getStarredMessages:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

// ─── Get shared media between two users ────────────────────────
export const getSharedMedia = async (req, res) => {
	try {
		const { userId } = req.params;
		const currentUserId = req.user._id;

		const messages = await Message.find({
			$or: [
				{ senderId: currentUserId, receiverId: userId },
				{ senderId: userId, receiverId: currentUserId },
			],
			"file.url": { $exists: true, $ne: null },
			deletedForEveryone: { $ne: true },
		})
			.sort({ createdAt: -1 })
			.select("file createdAt senderId")
			.populate("senderId", "fullName")
			.limit(200);

		const grouped = { images: [], videos: [], audio: [], documents: [] };
		for (const msg of messages) {
			const item = {
				_id: msg._id,
				url: msg.file.url,
				name: msg.file.name,
				type: msg.file.type,
				mimeType: msg.file.mimeType,
				size: msg.file.size,
				createdAt: msg.createdAt,
				senderName: msg.senderId?.fullName || "Unknown",
			};
			const category = msg.file.type === "image" ? "images"
				: msg.file.type === "video" ? "videos"
				: msg.file.type === "audio" ? "audio"
				: "documents";
			grouped[category].push(item);
		}

		res.status(200).json(grouped);
	} catch (error) {
		console.error("Error in getSharedMedia:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

// ─── Search messages ───────────────────────────────────────────
export const searchMessages = async (req, res) => {
	try {
		const { q, conversationWith } = req.query;
		const userId = req.user._id;

		if (!q?.trim()) return res.status(200).json([]);

		const query = {
			message: { $regex: q, $options: "i" },
			deletedForEveryone: { $ne: true },
			deletedFor: { $ne: userId },
		};

		// If searching within a specific conversation
		if (conversationWith) {
			query.$or = [
				{ senderId: userId, receiverId: conversationWith },
				{ senderId: conversationWith, receiverId: userId },
			];
		} else {
			query.$or = [{ senderId: userId }, { receiverId: userId }];
		}

		const messages = await Message.find(query)
			.sort({ createdAt: -1 })
			.limit(50)
			.populate("senderId", "fullName profilePic")
			.populate("receiverId", "fullName profilePic");

		res.status(200).json(messages);
	} catch (error) {
		console.error("Error in searchMessages:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
