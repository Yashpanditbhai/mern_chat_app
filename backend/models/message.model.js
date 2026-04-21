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

const Message = mongoose.model("Message", messageSchema);

export default Message;
