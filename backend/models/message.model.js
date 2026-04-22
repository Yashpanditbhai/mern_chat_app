import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
	{
		senderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		receiverId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		message: {
			type: String,
			default: "",
			maxlength: 5000,
		},
		// File attachment
		file: {
			url: { type: String },
			name: { type: String },
			type: { type: String }, // "image", "video", "audio", "document"
			mimeType: { type: String },
			size: { type: Number },
		},
		// Message status: sent → delivered → seen
		status: {
			type: String,
			enum: ["sent", "delivered", "seen"],
			default: "sent",
		},
		// Reactions: [{ userId, emoji }]
		reactions: [
			{
				userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
				emoji: { type: String },
			},
		],
		// Reply to another message
		replyTo: {
			messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
			text: { type: String },
			senderName: { type: String },
		},
		// Soft delete
		deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
		deletedForEveryone: { type: Boolean, default: false },
		// Pinned
		isPinned: { type: Boolean, default: false },
		// Starred by users
		starredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
		// Disappearing message (TTL in seconds, 0 = no expiry)
		expiresAt: { type: Date, default: null },
	},
	{ timestamps: true }
);

// At least one of message or file is required
messageSchema.pre("validate", function (next) {
	if (!this.message && !this.file?.url) {
		this.invalidate("message", "Message or file attachment is required");
	}
	next();
});

messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ message: "text" });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
