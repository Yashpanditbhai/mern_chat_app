// Server-side avatar generator — no external dependencies
function stringToColor(str) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}

	const maleColors = ["#3B82F6", "#6366F1", "#8B5CF6", "#0EA5E9", "#14B8A6", "#2563EB"];
	const femaleColors = ["#EC4899", "#F43F5E", "#A855F7", "#D946EF", "#F97316", "#E11D48"];
	const allColors = [...maleColors, ...femaleColors];
	const index = Math.abs(hash) % allColors.length;
	return allColors[index];
}

function getInitials(name) {
	if (!name) return "?";
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0][0].toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function generateAvatarUrl(fullName, gender) {
	const initials = getInitials(fullName);
	const bgColor = stringToColor(fullName + (gender || ""));

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="64" fill="${bgColor}"/><text x="64" y="64" dy="0.35em" text-anchor="middle" fill="white" font-family="system-ui,-apple-system,sans-serif" font-size="48" font-weight="600">${initials}</text></svg>`;

	return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
