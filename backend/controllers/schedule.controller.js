import ScheduledMessage from "../models/scheduledMessage.model.js";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io, isUserOnline } from "../socket/socket.js";

// ─── Schedule a message ────────────────────────────────────────
export const scheduleMessage = async (req, res) => {
	try {
		const { message, receiverId, scheduledAt, isGroupChat } = req.body;
		const senderId = req.user._id;

		if (!message?.trim()) {
			return res.status(400).json({ error: "Message is required" });
		}
		if (!receiverId) {
			return res.status(400).json({ error: "Receiver is required" });
		}
		if (!scheduledAt) {
			return res.status(400).json({ error: "Scheduled time is required" });
		}

		const scheduleDate = new Date(scheduledAt);
		if (scheduleDate <= new Date()) {
			return res.status(400).json({ error: "Scheduled time must be in the future" });
		}

		const scheduled = new ScheduledMessage({
			senderId,
			receiverId,
			message: message.trim(),
			scheduledAt: scheduleDate,
			isGroupChat: !!isGroupChat,
		});

		await scheduled.save();
		res.status(201).json(scheduled);
	} catch (error) {
		console.error("Error in scheduleMessage:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

// ─── Get user's pending scheduled messages ─────────────────────
export const getScheduledMessages = async (req, res) => {
	try {
		const senderId = req.user._id;
		const messages = await ScheduledMessage.find({
			senderId,
			status: "pending",
		})
			.sort({ scheduledAt: 1 })
			.populate("receiverId", "fullName profilePic");

		res.status(200).json(messages);
	} catch (error) {
		console.error("Error in getScheduledMessages:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

// ─── Cancel a scheduled message ────────────────────────────────
export const cancelScheduledMessage = async (req, res) => {
	try {
		const { id } = req.params;
		const senderId = req.user._id;

		const scheduled = await ScheduledMessage.findOne({
			_id: id,
			senderId,
			status: "pending",
		});

		if (!scheduled) {
			return res.status(404).json({ error: "Scheduled message not found" });
		}

		scheduled.status = "cancelled";
		await scheduled.save();

		res.status(200).json({ message: "Scheduled message cancelled" });
	} catch (error) {
		console.error("Error in cancelScheduledMessage:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

// ─── Process due scheduled messages (called by interval) ───────
export const processDueScheduledMessages = async () => {
	try {
		const now = new Date();
		const dueMessages = await ScheduledMessage.find({
			status: "pending",
			scheduledAt: { $lte: now },
		});

		for (const scheduled of dueMessages) {
			try {
				const { senderId, receiverId, message, isGroupChat } = scheduled;

				if (isGroupChat) {
					// Group message
					const conversation = await Conversation.findById(receiverId);
					if (!conversation || !conversation.isGroupChat) {
						scheduled.status = "cancelled";
						await scheduled.save();
						continue;
					}

					const sender = await User.findById(senderId).select("fullName");
					const newMessage = new Message({
						senderId,
						receiverId: senderId,
						message,
						status: "delivered",
					});

					conversation.messages.push(newMessage._id);
					conversation.lastMessage = {
						text: message.substring(0, 100),
						senderId,
						senderName: sender?.fullName || "",
						createdAt: new Date(),
					};

					await Promise.all([conversation.save(), newMessage.save()]);

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

					// Also emit to sender so their UI updates
					io.to(senderId.toString()).emit("newGroupMessage", messagePayload);
				} else {
					// Direct message
					let conversation = await Conversation.findOne({
						participants: { $all: [senderId, receiverId] },
						isGroupChat: { $ne: true },
					});

					if (!conversation) {
						conversation = await Conversation.create({
							participants: [senderId, receiverId],
						});
					}

					const initialStatus = isUserOnline(receiverId.toString()) ? "delivered" : "sent";
					const newMessage = new Message({
						senderId,
						receiverId,
						message,
						status: initialStatus,
					});

					conversation.messages.push(newMessage._id);
					conversation.lastMessage = {
						text: message.substring(0, 100),
						senderId,
						createdAt: new Date(),
					};

					await Promise.all([conversation.save(), newMessage.save()]);

					const receiverSocketId = getReceiverSocketId(receiverId.toString());
					if (receiverSocketId) {
						io.to(receiverId.toString()).emit("newMessage", {
							...newMessage.toJSON(),
							conversationId: conversation._id,
						});
					}

					// Also notify sender
					io.to(senderId.toString()).emit("newMessage", {
						...newMessage.toJSON(),
						conversationId: conversation._id,
					});
				}

				scheduled.status = "sent";
				await scheduled.save();
			} catch (err) {
				console.error(`Error processing scheduled message ${scheduled._id}:`, err.message);
			}
		}
	} catch (error) {
		console.error("Error in processDueScheduledMessages:", error.message);
	}
};
