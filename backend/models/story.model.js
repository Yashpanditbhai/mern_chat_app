import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		content: {
			type: String,
			required: true,
		},
		type: {
			type: String,
			enum: ["text", "image"],
			required: true,
		},
		color: {
			type: String,
			default: "#3B82F6",
		},
		expiresAt: {
			type: Date,
			required: true,
		},
		viewedBy: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
	},
	{ timestamps: true }
);

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
storySchema.index({ userId: 1 });

const Story = mongoose.model("Story", storySchema);

export default Story;
