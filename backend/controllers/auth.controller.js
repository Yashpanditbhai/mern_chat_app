import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import generateTokenAndSetCookie from "../utils/generateToken.js";
import { generateAvatarUrl } from "../utils/avatar.js";

export const signup = async (req, res) => {
	try {
		const { fullName, username, password, confirmPassword, gender } = req.body;

		// ─── Validation ────────────────────────────────────
		if (!fullName || !username || !password || !confirmPassword || !gender) {
			return res.status(400).json({ error: "All fields are required" });
		}

		if (typeof fullName !== "string" || fullName.trim().length < 2) {
			return res.status(400).json({ error: "Full name must be at least 2 characters" });
		}

		if (typeof username !== "string" || username.trim().length < 3) {
			return res.status(400).json({ error: "Username must be at least 3 characters" });
		}

		if (password.length < 6) {
			return res.status(400).json({ error: "Password must be at least 6 characters" });
		}

		if (password !== confirmPassword) {
			return res.status(400).json({ error: "Passwords don't match" });
		}

		if (!["male", "female"].includes(gender)) {
			return res.status(400).json({ error: "Gender must be male or female" });
		}

		const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
		if (existingUser) {
			return res.status(400).json({ error: "Username already exists" });
		}

		// ─── Create User ───────────────────────────────────
		const salt = await bcrypt.genSalt(12);
		const hashedPassword = await bcrypt.hash(password, salt);

		const profilePic = generateAvatarUrl(fullName.trim(), gender);

		const newUser = new User({
			fullName: fullName.trim(),
			username: username.toLowerCase().trim(),
			password: hashedPassword,
			gender,
			profilePic,
		});

		await newUser.save();

		// Generate JWT and return token for socket auth
		const token = generateTokenAndSetCookie(newUser._id, res);

		res.status(201).json({
			_id: newUser._id,
			fullName: newUser.fullName,
			username: newUser.username,
			profilePic: newUser.profilePic,
			token, // Frontend needs this for socket authentication
		});
	} catch (error) {
		console.error("Error in signup controller:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const login = async (req, res) => {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res.status(400).json({ error: "Username and password are required" });
		}

		const user = await User.findOne({ username: username.toLowerCase().trim() });
		if (!user) {
			return res.status(400).json({ error: "Invalid username or password" });
		}

		const isPasswordCorrect = await bcrypt.compare(password, user.password);
		if (!isPasswordCorrect) {
			return res.status(400).json({ error: "Invalid username or password" });
		}

		const token = generateTokenAndSetCookie(user._id, res);

		res.status(200).json({
			_id: user._id,
			fullName: user.fullName,
			username: user.username,
			profilePic: user.profilePic,
			token,
		});
	} catch (error) {
		console.error("Error in login controller:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const logout = (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 0 });
		res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		console.error("Error in logout controller:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
