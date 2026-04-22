import { createContext, useContext, useState, useCallback } from "react";
import translations, { LANGUAGES } from "../i18n/translations";

const LanguageContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
	return useContext(LanguageContext);
};

export const LanguageProvider = ({ children }) => {
	const [language, setLanguageState] = useState(
		() => localStorage.getItem("chat-language") || "en"
	);

	const setLanguage = useCallback((lang) => {
		setLanguageState(lang);
		localStorage.setItem("chat-language", lang);
	}, []);

	const t = useCallback(
		(key) => {
			return translations[language]?.[key] || translations.en?.[key] || key;
		},
		[language]
	);

	return (
		<LanguageContext.Provider value={{ language, setLanguage, t, LANGUAGES }}>
			{children}
		</LanguageContext.Provider>
	);
};
