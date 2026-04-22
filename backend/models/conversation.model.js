import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
	{
		participants: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		messages: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Message",
				default: [],
			},
		],
		// Last message for sidebar preview
		lastMessage: {
			text: { type: String, default: "" },
			senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
			senderName: { type: String, default: "" },
			createdAt: { type: Date },
		},
		// Group chat fields
		isGroupChat: { type: Boolean, default: false },
		groupName: { type: String, trim: true, maxlength: 100 },
		groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		groupPic: { type: String, default: "" },
		admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
		settings: {
			onlyAdminsCanMessage: { type: Boolean, default: false },
		},
	},
	{ timestamps: true }
);

// Compound index for fast conversation lookup between two users
conversationSchema.index({ participants: 1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
