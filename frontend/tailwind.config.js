/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {},
	},
	// eslint-disable-next-line no-undef
	plugins: [require("daisyui")],
	daisyui: {
		themes: [
			{
				flashchat: {
					primary: "#3B82F6",
					secondary: "#6366F1",
					accent: "#10B981",
					neutral: "#1E293B",
					"base-100": "#0F172A",
					"base-200": "#1E293B",
					"base-300": "#334155",
					info: "#38BDF8",
					success: "#22C55E",
					warning: "#F59E0B",
					error: "#EF4444",
				},
			},
		],
	},
};
