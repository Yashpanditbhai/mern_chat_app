// Generate a consistent color from a string (name/username)
function stringToColor(str) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}

	const maleColors = ["#3B82F6", "#6366F1", "#8B5CF6", "#0EA5E9", "#14B8A6", "#2563EB"];
	const femaleColors = ["#EC4899", "#F43F5E", "#A855F7", "#D946EF", "#F97316", "#E11D48"];

	// Default palette if no gender
	const allColors = [...maleColors, ...femaleColors];
	const index = Math.abs(hash) % allColors.length;
	return allColors[index];
}

// Get initials from full name
function getInitials(name) {
	if (!name) return "?";
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0][0].toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Generate an SVG data URL avatar with initials
export function generateAvatar(name, gender) {
	const initials = getInitials(name);
	const bgColor = stringToColor(name + (gender || ""));

	const svg = `
		<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
			<rect width="128" height="128" rx="64" fill="${bgColor}"/>
			<text x="64" y="64" dy="0.35em" text-anchor="middle" fill="white"
				font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="600">
				${initials}
			</text>
		</svg>
	`.trim();

	return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Fallback: if profilePic URL fails, use this
export function getProfilePic(user) {
	if (user?.profilePic && !user.profilePic.includes("avatar.iran.liara.run")) {
		return user.profilePic;
	}
	return generateAvatar(user?.fullName || user?.username || "User", user?.gender);
}
