import fetch from "node-fetch";

// ─── GIF Search via Giphy ──────────────────────────────────────
const GIPHY_API_KEY = process.env.GIPHY_API_KEY || "GlVGYHkr3WSBnllca54iNt0yFbjz7L65"; // Free public beta key
const GIPHY_BASE = "https://api.giphy.com/v1/gifs";

export const searchGifs = async (req, res) => {
	try {
		const { q } = req.query;
		if (!q?.trim()) {
			// Trending GIFs
			const response = await fetch(
				`${GIPHY_BASE}/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=pg-13`
			);
			const data = await response.json();
			return res.json(formatGifs(data.data));
		}

		const response = await fetch(
			`${GIPHY_BASE}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=20&rating=pg-13`
		);
		const data = await response.json();
		res.json(formatGifs(data.data));
	} catch (error) {
		console.error("GIF search error:", error.message);
		res.status(500).json({ error: "Failed to fetch GIFs" });
	}
};

function formatGifs(gifs) {
	return gifs.map((gif) => ({
		id: gif.id,
		url: gif.images.fixed_height.url,
		preview: gif.images.fixed_height_small.url || gif.images.preview_gif?.url || gif.images.fixed_height.url,
		width: gif.images.fixed_height.width,
		height: gif.images.fixed_height.height,
		title: gif.title,
	}));
}

// ─── AI Chatbot ────────────────────────────────────────────────
export const aiChat = async (req, res) => {
	try {
		const { message } = req.body;
		if (!message?.trim()) {
			return res.status(400).json({ error: "Message is required" });
		}

		const input = message.trim().toLowerCase();
		let response;

		// Greetings
		if (/^(hi|hello|hey|howdy|hola|yo|sup)\b/.test(input)) {
			const greetings = [
				"Hey there! How can I help you today?",
				"Hello! Welcome to Flash Chat. What can I do for you?",
				"Hi! I'm your Flash Chat assistant. Ask me anything about the app!",
				"Hey! Great to see you. Need help with anything?",
			];
			response = greetings[Math.floor(Math.random() * greetings.length)];
		}
		// Help
		else if (/\b(help|features|what can you do|commands)\b/.test(input)) {
			response = "Here are some things Flash Chat can do:\n\n" +
				"- Send text messages, images, videos & documents\n" +
				"- Voice messages & camera capture\n" +
				"- GIF search & emoji picker\n" +
				"- Group chats with admin controls\n" +
				"- Message reactions, replies & forwarding\n" +
				"- Pin & star important messages\n" +
				"- Audio & video calls (WebRTC)\n" +
				"- Stories (like social media)\n" +
				"- Polls in group chats\n" +
				"- Schedule messages for later\n" +
				"- Export chat history\n" +
				"- Drag & drop file sharing\n" +
				"- Shared media viewer\n" +
				"- Multi-language support (EN, HI, ES)\n" +
				"- Dark/light themes & wallpapers\n\n" +
				"Ask me about any specific feature!";
		}
		// About the app
		else if (/\b(about|what is|what's this|flash chat)\b/.test(input)) {
			response = "Flash Chat is a full-featured real-time messaging application built with the MERN stack (MongoDB, Express, React, Node.js). It uses Socket.IO for real-time communication and supports file sharing, video calls, and much more!";
		}
		// How to send messages
		else if (/\b(how.*(send|message|chat))\b/.test(input)) {
			response = "To send a message, select a conversation from the sidebar and type in the message input at the bottom. You can also attach files, send voice messages, GIFs, and take photos with the camera!";
		}
		// Groups
		else if (/\b(group|create group)\b/.test(input)) {
			response = "To create a group, click the '+' button in the sidebar header. You can add members, set a group name, and manage admin settings. Group admins can control who can send messages.";
		}
		// Calls
		else if (/\b(call|video|audio|ring)\b/.test(input)) {
			response = "You can make audio and video calls by clicking the phone or camera icons in the chat header. Calls use WebRTC for peer-to-peer connections. Screen sharing is also supported during video calls!";
		}
		// Fun responses
		else if (/\b(joke|funny|laugh)\b/.test(input)) {
			const jokes = [
				"Why do programmers prefer dark mode? Because light attracts bugs!",
				"There are only 10 types of people: those who understand binary and those who don't.",
				"A SQL query walks into a bar, sees two tables, and asks 'Can I JOIN you?'",
			];
			response = jokes[Math.floor(Math.random() * jokes.length)];
		}
		else if (/\b(thanks|thank you|thx)\b/.test(input)) {
			response = "You're welcome! Let me know if there's anything else I can help with.";
		}
		else if (/\b(bye|goodbye|see you|cya)\b/.test(input)) {
			response = "Goodbye! Have a great day! Come back anytime you need help.";
		}
		else if (/\b(who are you|your name|what are you)\b/.test(input)) {
			response = "I'm Flash Bot, your friendly Flash Chat assistant! I can help you learn about the app's features and answer your questions.";
		}
		// Fallback
		else {
			response = "I'm a simple assistant bot for Flash Chat. Try asking me about the app's features, how to send messages, create groups, make calls, or just say 'help' to see everything I can tell you about!";
		}

		res.json({ response });
	} catch (error) {
		console.error("AI chat error:", error.message);
		res.status(500).json({ error: "Failed to generate response" });
	}
};

// ─── Link Preview ──────────────────────────────────────────────
export const getLinkPreview = async (req, res) => {
	try {
		const { url } = req.query;
		if (!url) return res.status(400).json({ error: "URL is required" });

		// Basic URL validation
		let parsedUrl;
		try {
			parsedUrl = new URL(url);
		} catch {
			return res.status(400).json({ error: "Invalid URL" });
		}

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 5000);

		const response = await fetch(parsedUrl.href, {
			signal: controller.signal,
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; ChatApp/1.0)",
			},
		});
		clearTimeout(timeout);

		const html = await response.text();

		// Extract meta tags
		const getMetaContent = (name) => {
			const patterns = [
				new RegExp(`<meta[^>]*property=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"),
				new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${name}["']`, "i"),
				new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"),
				new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, "i"),
			];
			for (const pattern of patterns) {
				const match = html.match(pattern);
				if (match) return match[1];
			}
			return null;
		};

		const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);

		const preview = {
			url: parsedUrl.href,
			title: getMetaContent("og:title") || getMetaContent("twitter:title") || titleMatch?.[1] || "",
			description: getMetaContent("og:description") || getMetaContent("description") || getMetaContent("twitter:description") || "",
			image: getMetaContent("og:image") || getMetaContent("twitter:image") || "",
			siteName: getMetaContent("og:site_name") || parsedUrl.hostname,
		};

		// Make relative image URLs absolute
		if (preview.image && !preview.image.startsWith("http")) {
			preview.image = new URL(preview.image, parsedUrl.origin).href;
		}

		res.json(preview);
	} catch (error) {
		if (error.name === "AbortError") {
			return res.status(408).json({ error: "Request timeout" });
		}
		console.error("Link preview error:", error.message);
		res.status(500).json({ error: "Failed to fetch preview" });
	}
};
