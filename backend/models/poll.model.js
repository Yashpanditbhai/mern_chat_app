import mongoose from "mongoose";

const pollSchema = new mongoose.Schema(
	{
		conversationId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Conversation",
			required: true,
		},
		question: {
			type: String,
			required: true,
			maxlength: 500,
		},
		options: [
			{
				text: { type: String, required: true },
				votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
			},
		],
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		expiresAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true }
);

pollSchema.index({ conversationId: 1 });

const Poll = mongoose.model("Poll", pollSchema);

export default Poll;
