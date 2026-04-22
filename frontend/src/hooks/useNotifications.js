import { useEffect, useCallback } from "react";

const useNotifications = () => {
	// Request permission on mount
	useEffect(() => {
		if ("Notification" in window && Notification.permission === "default") {
			Notification.requestPermission();
		}
	}, []);

	const showNotification = useCallback((title, body, icon) => {
		if (
			!("Notification" in window) ||
			Notification.permission !== "granted" ||
			!document.hidden
		) {
			return;
		}

		const notification = new Notification(title, {
			body: body || "",
			icon: icon || "/favicon.ico",
			tag: "flash-chat-message",
		});

		notification.onclick = () => {
			window.focus();
			notification.close();
		};

		// Auto close after 5 seconds
		setTimeout(() => notification.close(), 5000);
	}, []);

	return { showNotification };
};

export default useNotifications;
