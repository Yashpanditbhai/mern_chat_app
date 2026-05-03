import fetch from "node-fetch";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Azure OpenAI Setup ─────────────────────────────────────────
const azureConfig = process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT ? {
	endpoint: process.env.AZURE_OPENAI_ENDPOINT,
	apiKey: process.env.AZURE_OPENAI_API_KEY,
	deployment: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4.1",
	apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-05-01-preview",
} : null;

if (azureConfig) {
	console.log(`Azure OpenAI initialized (${azureConfig.deployment})`);
}

// ─── Gemini AI Setup (fallback) ─────────────────────────────────
let geminiModel = null;
if (!azureConfig && process.env.GEMINI_API_KEY) {
	const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
	geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
	console.log("Gemini AI initialized (fallback)");
}

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

// ─── AI Chatbot (Gemini-powered with fallback) ────────────────
const SYSTEM_PROMPT = `You are Flash Bot, a friendly AI assistant built into Flash Chat — a full-featured real-time messaging app. You help users with questions about the app and general conversation.

Flash Chat features: text/image/video/audio messaging, voice messages, GIF search, emoji picker, group chats with admin controls, message reactions/replies/forwarding, pinned & starred messages, audio/video calls (WebRTC), screen sharing, 24h stories, polls in groups, scheduled messages, chat export, drag & drop file sharing, shared media viewer, multi-language support (English, Hindi, Spanish), dark/light themes, chat wallpapers, AI chatbot (you!), and more.

Keep responses concise (2-3 sentences max unless the user asks for details). Be friendly and helpful. You can answer general knowledge questions too, not just app-related ones.`;

// Conversation history per user (in-memory, limited)
const chatHistory = new Map();
const MAX_HISTORY = 20;

async function callAzureOpenAI(userId, userMessage) {
	if (!azureConfig) return null;

	if (!chatHistory.has(userId)) chatHistory.set(userId, []);
	const history = chatHistory.get(userId);

	const messages = [
		{ role: "system", content: SYSTEM_PROMPT },
		...history,
		{ role: "user", content: userMessage },
	];

	const url = `${azureConfig.endpoint}openai/deployments/${azureConfig.deployment}/chat/completions?api-version=${azureConfig.apiVersion}`;

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"api-key": azureConfig.apiKey,
		},
		body: JSON.stringify({
			messages,
			max_tokens: 500,
			temperature: 0.7,
		}),
	});

	if (!response.ok) {
		const err = await response.text();
		throw new Error(`Azure OpenAI error: ${response.status} - ${err}`);
	}

	const data = await response.json();
	const reply = data.choices?.[0]?.message?.content;

	if (reply) {
		history.push(
			{ role: "user", content: userMessage },
			{ role: "assistant", content: reply }
		);
		if (history.length > MAX_HISTORY * 2) history.splice(0, 2);
	}

	return reply;
}

async function callGemini(userId, userMessage) {
	if (!geminiModel) return null;

	if (!chatHistory.has(userId)) chatHistory.set(userId, []);
	const history = chatHistory.get(userId);

	// Convert history to Gemini format
	const geminiHistory = history.map((m) => ({
		role: m.role === "assistant" ? "model" : "user",
		parts: [{ text: m.content }],
	}));

	const chat = geminiModel.startChat({
		history: [
			{ role: "user", parts: [{ text: "System instruction: " + SYSTEM_PROMPT }] },
			{ role: "model", parts: [{ text: "Understood! I'm Flash Bot, ready to help." }] },
			...geminiHistory,
		],
	});

	const result = await chat.sendMessage(userMessage);
	const reply = result.response.text();

	if (reply) {
		history.push(
			{ role: "user", content: userMessage },
			{ role: "assistant", content: reply }
		);
		if (history.length > MAX_HISTORY * 2) history.splice(0, 2);
	}

	return reply;
}

export const aiChat = async (req, res) => {
	try {
		const { message } = req.body;
		const userId = req.user._id.toString();

		if (!message?.trim()) {
			return res.status(400).json({ error: "Message is required" });
		}

		let response = null;
		const userMessage = message.trim();

		// Try Azure OpenAI first
		if (azureConfig) {
			try {
				response = await callAzureOpenAI(userId, userMessage);
			} catch (err) {
				console.error("Azure OpenAI error:", err.message);
			}
		}

		// Try Gemini as fallback
		if (!response && geminiModel) {
			try {
				response = await callGemini(userId, userMessage);
			} catch (err) {
				console.error("Gemini error:", err.message);
			}
		}

		// Final fallback: pattern matching
		if (!response) {
			response = getFallbackResponse(userMessage.toLowerCase());
		}

		res.json({ response });
	} catch (error) {
		console.error("AI chat error:", error.message);
		res.status(500).json({ error: "Failed to generate response" });
	}
};

// Clear chat history endpoint
export const clearAiChat = async (req, res) => {
	const userId = req.user._id.toString();
	chatHistory.delete(userId);
	res.json({ message: "Chat history cleared" });
};

function getFallbackResponse(input) {
	if (/^(hi|hello|hey|howdy|hola|yo|sup)\b/.test(input)) {
		const g = ["Hey there! How can I help you today?", "Hello! Welcome to Flash Chat!", "Hi! Ask me anything about the app!"];
		return g[Math.floor(Math.random() * g.length)];
	}
	if (/\b(help|features|what can you do)\b/.test(input)) {
		return "Flash Chat features: messaging, voice messages, GIFs, group chats, video/audio calls, stories, polls, scheduled messages, chat export, file sharing, themes, multi-language support, and more! Ask about any specific feature.";
	}
	if (/\b(joke|funny)\b/.test(input)) {
		const j = ["Why do programmers prefer dark mode? Because light attracts bugs!", "A SQL query walks into a bar, sees two tables, and asks 'Can I JOIN you?'"];
		return j[Math.floor(Math.random() * j.length)];
	}
	if (/\b(thanks|thank you)\b/.test(input)) return "You're welcome!";
	if (/\b(bye|goodbye)\b/.test(input)) return "Goodbye! Have a great day!";
	return "I'm Flash Bot — your chat assistant. For smarter AI responses, ask the admin to add a GEMINI_API_KEY. Try 'help' to see app features!";
}

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
