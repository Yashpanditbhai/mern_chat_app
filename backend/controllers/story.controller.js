import Story from "../models/story.model.js";
import { io } from "../socket/socket.js";

export const createStory = async (req, res) => {
	try {
		const { content, type, color } = req.body;
		const userId = req.user._id;

		if (!content?.trim()) {
			return res.status(400).json({ error: "Story content is required" });
		}

		if (!["text", "image"].includes(type)) {
			return res.status(400).json({ error: "Story type must be text or image" });
		}

		const storyData = {
			userId,
			content: content.trim(),
			type,
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
		};

		if (type === "text" && color) {
			storyData.color = color;
		}

		// Handle image upload
		if (type === "image" && req.file) {
			storyData.content = `/uploads/${req.file.filename}`;
		}

		const story = await Story.create(storyData);
		const populated = await Story.findById(story._id).populate("userId", "fullName profilePic username");

		io.emit("newStory", populated);

		res.status(201).json(populated);
	} catch (error) {
		console.error("Error in createStory:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getStories = async (req, res) => {
	try {
		const stories = await Story.find({
			expiresAt: { $gt: new Date() },
		})
			.populate("userId", "fullName profilePic username")
			.sort({ createdAt: -1 });

		// Group stories by user
		const grouped = {};
		for (const story of stories) {
			const uid = story.userId._id.toString();
			if (!grouped[uid]) {
				grouped[uid] = {
					user: story.userId,
					stories: [],
				};
			}
			grouped[uid].stories.push(story);
		}

		res.status(200).json(Object.values(grouped));
	} catch (error) {
		console.error("Error in getStories:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const viewStory = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user._id;

		const story = await Story.findById(id);
		if (!story) return res.status(404).json({ error: "Story not found" });

		if (!story.viewedBy.some((v) => v.toString() === userId.toString())) {
			story.viewedBy.push(userId);
			await story.save();
		}

		res.status(200).json({ success: true });
	} catch (error) {
		console.error("Error in viewStory:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
