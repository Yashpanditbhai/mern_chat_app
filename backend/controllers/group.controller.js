import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import { io } from "../socket/socket.js";

export const createGroup = async (req, res) => {
	try {
		const { groupName, participants } = req.body;
		const adminId = req.user._id;

		if (!groupName?.trim()) {
			return res.status(400).json({ error: "Group name is required" });
		}

		if (!participants || participants.length < 1) {
			return res.status(400).json({ error: "At least 1 other participant is required" });
		}

		// Include admin in participants
		const allParticipants = [...new Set([adminId.toString(), ...participants])];

		// Verify all participants exist
		const users = await User.find({ _id: { $in: allParticipants } }).select("_id fullName");
		if (users.length !== allParticipants.length) {
			return res.status(400).json({ error: "Some participants not found" });
		}

		const group = await Conversation.create({
			participants: allParticipants,
			isGroupChat: true,
			groupName: groupName.trim(),
			groupAdmin: adminId,
			admins: [adminId],
		});

		const populated = await Conversation.findById(group._id)
			.populate("participants", "-password")
			.populate("groupAdmin", "-password");

		// Notify all participants via socket
		allParticipants.forEach((userId) => {
			io.to(userId).emit("newGroup", populated);
		});

		res.status(201).json(populated);
	} catch (error) {
		console.error("Error in createGroup:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getMyGroups = async (req, res) => {
	try {
		const groups = await Conversation.find({
			participants: req.user._id,
			isGroupChat: true,
		})
			.populate("participants", "-password")
			.populate("groupAdmin", "-password")
			.sort({ updatedAt: -1 });

		res.status(200).json(groups);
	} catch (error) {
		console.error("Error in getMyGroups:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getGroupDetails = async (req, res) => {
	try {
		const group = await Conversation.findById(req.params.id)
			.populate("participants", "-password")
			.populate("groupAdmin", "-password");

		if (!group || !group.isGroupChat) {
			return res.status(404).json({ error: "Group not found" });
		}

		if (!group.participants.some((p) => p._id.toString() === req.user._id.toString())) {
			return res.status(403).json({ error: "Not a member of this group" });
		}

		res.status(200).json(group);
	} catch (error) {
		console.error("Error in getGroupDetails:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const updateGroupSettings = async (req, res) => {
	try {
		const group = await Conversation.findById(req.params.id);
		if (!group || !group.isGroupChat) {
			return res.status(404).json({ error: "Group not found" });
		}

		const userId = req.user._id.toString();
		const adminId = group.groupAdmin?.toString();
		const isAdmin = adminId === userId || (group.admins || []).some((a) => a.toString() === userId);

		if (!isAdmin) {
			return res.status(403).json({ error: "Only admins can change settings" });
		}

		if (req.body.onlyAdminsCanMessage !== undefined) {
			if (!group.settings) group.settings = {};
			group.settings.onlyAdminsCanMessage = !!req.body.onlyAdminsCanMessage;
		}

		await group.save();

		const populated = await Conversation.findById(group._id)
			.populate("participants", "-password")
			.populate("groupAdmin", "-password");

		// Notify all participants
		group.participants.forEach((pid) => {
			io.to(pid.toString()).emit("groupUpdated", populated);
		});

		res.status(200).json(populated);
	} catch (error) {
		console.error("Error in updateGroupSettings:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const makeAdmin = async (req, res) => {
	try {
		const group = await Conversation.findById(req.params.id);
		if (!group || !group.isGroupChat) {
			return res.status(404).json({ error: "Group not found" });
		}

		const userId = req.user._id.toString();
		const adminId = group.groupAdmin?.toString();

		if (adminId !== userId) {
			return res.status(403).json({ error: "Only group creator can promote admins" });
		}

		const targetUserId = req.params.userId;

		if (!group.participants.some((p) => p.toString() === targetUserId)) {
			return res.status(400).json({ error: "User is not a member of this group" });
		}

		if (!group.admins) group.admins = [group.groupAdmin];

		const idx = group.admins.findIndex((a) => a.toString() === targetUserId);
		if (idx !== -1) {
			// Don't remove the group creator
			if (targetUserId === adminId) {
				return res.status(400).json({ error: "Cannot remove the group creator from admins" });
			}
			group.admins.splice(idx, 1);
		} else {
			group.admins.push(targetUserId);
		}

		await group.save();

		const populated = await Conversation.findById(group._id)
			.populate("participants", "-password")
			.populate("groupAdmin", "-password");

		group.participants.forEach((pid) => {
			io.to(pid.toString()).emit("groupUpdated", populated);
		});

		res.status(200).json(populated);
	} catch (error) {
		console.error("Error in makeAdmin:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const leaveGroup = async (req, res) => {
	try {
		const group = await Conversation.findById(req.params.id);
		if (!group || !group.isGroupChat) {
			return res.status(404).json({ error: "Group not found" });
		}

		const userId = req.user._id.toString();
		group.participants = group.participants.filter((p) => p.toString() !== userId);

		if (group.participants.length === 0) {
			await Conversation.findByIdAndDelete(group._id);
			return res.status(200).json({ message: "Group deleted" });
		}

		// Transfer admin if the admin left
		if (group.groupAdmin.toString() === userId) {
			group.groupAdmin = group.participants[0];
		}

		await group.save();

		io.to(req.params.id).emit("groupUpdated", { groupId: group._id });

		res.status(200).json({ message: "Left group" });
	} catch (error) {
		console.error("Error in leaveGroup:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
