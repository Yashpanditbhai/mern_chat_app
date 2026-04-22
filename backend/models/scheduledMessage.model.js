import mongoose from "mongoose";

const scheduledMessageSchema = new mongoose.Schema(
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
		scheduledAt: {
			type: Date,
			required: true,
		},
		status: {
			type: String,
			enum: ["pending", "sent", "cancelled"],
			default: "pending",
		},
		isGroupChat: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

scheduledMessageSchema.index({ status: 1, scheduledAt: 1 });
scheduledMessageSchema.index({ senderId: 1, status: 1 });

const ScheduledMessage = mongoose.model("ScheduledMessage", scheduledMessageSchema);

export default ScheduledMessage;
