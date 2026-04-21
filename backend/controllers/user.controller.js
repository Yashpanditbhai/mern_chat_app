import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

export const getUsersForSidebar = async (req, res) => {
	try {
		const loggedInUserId = req.user._id;

		// Get all users except current user
		const users = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

		// Get conversations for this user to attach lastMessage + unread counts
		const conversations = await Conversation.find({
			participants: loggedInUserId,
		});

		// Build a map of userId → { lastMessage, unreadCount }
		const conversationDataMap = {};

		for (const conv of conversations) {
			const otherUserId = conv.participants.find(
				(p) => p.toString() !== loggedInUserId.toString()
			);

			if (!otherUserId) continue;

			// Count unread messages FROM the other user TO me
			const unreadCount = await Message.countDocuments({
				senderId: otherUserId,
				receiverId: loggedInUserId,
				status: { $ne: "seen" },
			});

			conversationDataMap[otherUserId.toString()] = {
				lastMessage: conv.lastMessage || null,
				unreadCount,
			};
		}

		// Merge user data with conversation metadata
		const usersWithMeta = users.map((user) => {
			const meta = conversationDataMap[user._id.toString()] || {
				lastMessage: null,
				unreadCount: 0,
			};
			return {
				...user.toJSON(),
				lastMessage: meta.lastMessage,
				unreadCount: meta.unreadCount,
			};
		});

		// Sort: users with recent messages first, then by unread count
		usersWithMeta.sort((a, b) => {
			if (a.lastMessage?.createdAt && b.lastMessage?.createdAt) {
				return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
			}
			if (a.lastMessage?.createdAt) return -1;
			if (b.lastMessage?.createdAt) return 1;
			return b.unreadCount - a.unreadCount;
		});

		res.status(200).json(usersWithMeta);
	} catch (error) {
		console.error("Error in getUsersForSidebar:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
