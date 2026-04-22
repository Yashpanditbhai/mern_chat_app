import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		fullName: {
			type: String,
			required: true,
			trim: true,
		},
		username: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
		},
		gender: {
			type: String,
			required: true,
			enum: ["male", "female"],
		},
		profilePic: {
			type: String,
			default: "",
		},
		statusText: {
			type: String,
			default: "",
			maxlength: 150,
		},
		lastSeen: {
			type: Date,
			default: null,
		},
		blockedUsers: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		mutedUsers: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
	},
	{ timestamps: true }
);

// Index for fast lookup during login/signup
userSchema.index({ username: 1 });

const User = mongoose.model("User", userSchema);

export default User;
