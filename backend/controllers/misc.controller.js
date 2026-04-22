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
