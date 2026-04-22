import Poll from "../models/poll.model.js";
import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import { io } from "../socket/socket.js";

export const createPoll = async (req, res) => {
	try {
		const { id: conversationId } = req.params;
		const { question, options, expiresAt } = req.body;
		const userId = req.user._id;

		if (!question?.trim()) {
			return res.status(400).json({ error: "Question is required" });
		}

		if (!options || options.length < 2) {
			return res.status(400).json({ error: "At least 2 options are required" });
		}

		const conversation = await Conversation.findById(conversationId);
		if (!conversation || !conversation.isGroupChat) {
			return res.status(404).json({ error: "Group not found" });
		}

		if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
			return res.status(403).json({ error: "Not a member of this group" });
		}

		const pollData = {
			conversationId,
			question: question.trim(),
			options: options.map((opt) => ({ text: opt.trim(), votes: [] })),
			createdBy: userId,
		};

		if (expiresAt) {
			pollData.expiresAt = new Date(expiresAt);
		}

		const poll = await Poll.create(pollData);
		const populated = await Poll.findById(poll._id)
			.populate("createdBy", "fullName profilePic");

		// Notify group members
		conversation.participants.forEach((participantId) => {
			io.to(participantId.toString()).emit("newPoll", {
				...populated.toJSON(),
				conversationId,
			});
		});

		res.status(201).json(populated);
	} catch (error) {
		console.error("Error in createPoll:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const votePoll = async (req, res) => {
	try {
		const { pollId } = req.params;
		const { optionIndex } = req.body;
		const userId = req.user._id;

		const poll = await Poll.findById(pollId);
		if (!poll) return res.status(404).json({ error: "Poll not found" });

		if (optionIndex < 0 || optionIndex >= poll.options.length) {
			return res.status(400).json({ error: "Invalid option" });
		}

		// Remove previous vote from all options
		for (const option of poll.options) {
			option.votes = option.votes.filter((v) => v.toString() !== userId.toString());
		}

		// Add vote to selected option
		poll.options[optionIndex].votes.push(userId);
		await poll.save();

		const populated = await Poll.findById(poll._id)
			.populate("createdBy", "fullName profilePic");

		// Notify group members
		const conversation = await Conversation.findById(poll.conversationId);
		if (conversation) {
			conversation.participants.forEach((participantId) => {
				io.to(participantId.toString()).emit("pollVoted", {
					...populated.toJSON(),
					conversationId: poll.conversationId,
				});
			});
		}

		res.status(200).json(populated);
	} catch (error) {
		console.error("Error in votePoll:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getGroupPolls = async (req, res) => {
	try {
		const { id: conversationId } = req.params;
		const userId = req.user._id;

		const conversation = await Conversation.findById(conversationId);
		if (!conversation || !conversation.isGroupChat) {
			return res.status(404).json({ error: "Group not found" });
		}

		if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
			return res.status(403).json({ error: "Not a member of this group" });
		}

		const polls = await Poll.find({ conversationId })
			.populate("createdBy", "fullName profilePic")
			.sort({ createdAt: -1 });

		res.status(200).json(polls);
	} catch (error) {
		console.error("Error in getGroupPolls:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
