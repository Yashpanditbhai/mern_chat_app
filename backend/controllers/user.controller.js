import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { io } from "../socket/socket.js";

export const getUsersForSidebar = async (req, res) => {
	try {
		const loggedInUserId = req.user._id;

		// Get all users except current user
		const users = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

		// Get direct conversations for this user to attach lastMessage + unread counts
		const conversations = await Conversation.find({
			participants: loggedInUserId,
			isGroupChat: { $ne: true },
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

export const toggleBlockUser = async (req, res) => {
	try {
		const userId = req.user._id;
		const { userId: targetId } = req.params;

		if (userId.toString() === targetId) {
			return res.status(400).json({ error: "Cannot block yourself" });
		}

		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		const idx = user.blockedUsers.findIndex((id) => id.toString() === targetId);
		if (idx !== -1) {
			user.blockedUsers.splice(idx, 1);
		} else {
			user.blockedUsers.push(targetId);
		}

		await user.save();
		res.status(200).json({ blocked: idx === -1, blockedUsers: user.blockedUsers });
	} catch (error) {
		console.error("Error in toggleBlockUser:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const toggleMuteUser = async (req, res) => {
	try {
		const userId = req.user._id;
		const { userId: targetId } = req.params;

		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		const idx = user.mutedUsers.findIndex((id) => id.toString() === targetId);
		if (idx !== -1) {
			user.mutedUsers.splice(idx, 1);
		} else {
			user.mutedUsers.push(targetId);
		}

		await user.save();
		res.status(200).json({ muted: idx === -1, mutedUsers: user.mutedUsers });
	} catch (error) {
		console.error("Error in toggleMuteUser:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getBlockedAndMutedUsers = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select("blockedUsers mutedUsers");
		res.status(200).json({
			blockedUsers: user.blockedUsers || [],
			mutedUsers: user.mutedUsers || [],
		});
	} catch (error) {
		console.error("Error in getBlockedAndMutedUsers:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const updateProfile = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		if (req.body.statusText !== undefined) {
			user.statusText = req.body.statusText.substring(0, 150);
		}

		if (req.file) {
			user.profilePic = `/uploads/${req.file.filename}`;
		}

		await user.save();

		const userData = user.toJSON();
		delete userData.password;

		// Broadcast profile update to all connected users
		io.emit("userProfileUpdated", {
			userId: userId.toString(),
			profilePic: userData.profilePic,
			statusText: userData.statusText,
		});

		res.status(200).json(userData);
	} catch (error) {
		console.error("Error in updateProfile:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
