import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
	const [theme, setTheme] = useState(() => {
		return localStorage.getItem("chat-theme") || "flashchat";
	});

	const [chatWallpaper, setChatWallpaper] = useState(() => {
		return localStorage.getItem("chat-wallpaper") || "";
	});

	useEffect(() => {
		document.documentElement.setAttribute("data-theme", theme);
		localStorage.setItem("chat-theme", theme);
	}, [theme]);

	useEffect(() => {
		localStorage.setItem("chat-wallpaper", chatWallpaper);
	}, [chatWallpaper]);

	const toggleTheme = () => {
		setTheme((prev) => (prev === "flashchat" ? "flashchatlight" : "flashchat"));
	};

	const isDark = theme === "flashchat";

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme, isDark, chatWallpaper, setChatWallpaper }}>
			{children}
		</ThemeContext.Provider>
	);
};
