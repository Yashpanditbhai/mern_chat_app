import { useRef, useCallback } from "react";
import { useSocketContext } from "../context/SocketContext";

const useTypingIndicator = (receiverId) => {
	const { socket } = useSocketContext();
	const typingTimeoutRef = useRef(null);
	const isTypingRef = useRef(false);

	const handleTyping = useCallback(() => {
		if (!socket || !receiverId) return;

		if (!isTypingRef.current) {
			isTypingRef.current = true;
			socket.emit("typing", { receiverId });
		}

		// Reset the stop-typing timer on each keystroke (debounce)
		clearTimeout(typingTimeoutRef.current);
		typingTimeoutRef.current = setTimeout(() => {
			isTypingRef.current = false;
			socket.emit("stopTyping", { receiverId });
		}, 1500);
	}, [socket, receiverId]);

	const stopTyping = useCallback(() => {
		if (!socket || !receiverId) return;
		clearTimeout(typingTimeoutRef.current);
		if (isTypingRef.current) {
			isTypingRef.current = false;
			socket.emit("stopTyping", { receiverId });
		}
	}, [socket, receiverId]);

	return { handleTyping, stopTyping };
};

export default useTypingIndicator;
