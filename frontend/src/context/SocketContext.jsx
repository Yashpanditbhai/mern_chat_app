import { createContext, useState, useEffect, useContext, useRef } from "react";
import { useAuthContext } from "./AuthContext";
import useConversation from "../zustand/useConversation";
import io from "socket.io-client";
import notificationSound from "../assets/sounds/notification.mp3";

const SocketContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useSocketContext = () => {
	return useContext(SocketContext);
};

const SOCKET_URL = "http://localhost:5001";

export const SocketContextProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const { authUser, setAuthUser } = useAuthContext();
	const soundRef = useRef(new Audio(notificationSound));

	useEffect(() => {
		// If user has no token (old login before rewrite), force re-login
		if (authUser && !authUser.token) {
			console.warn("No token in stored user data — forcing re-login");
			localStorage.removeItem("chat-user");
			setAuthUser(null);
			return;
		}

		if (!authUser?.token) {
			// Not logged in — clean up socket
			setSocket((prev) => {
				if (prev) prev.close();
				return null;
			});
			setOnlineUsers([]);
			return;
		}

		// ─── Connect with JWT token (secure auth) ───────────────
		const newSocket = io(SOCKET_URL, {
			auth: {
				token: authUser.token,
			},
			reconnection: true,
			reconnectionAttempts: 10,
			reconnectionDelay: 1000,
		});

		newSocket.on("connect", () => {
			console.log("Socket connected:", newSocket.id);
		});

		newSocket.on("connect_error", (error) => {
			console.error("Socket connection error:", error.message);
		});

		// ─── Online users ───────────────────────────────────────
		newSocket.on("getOnlineUsers", (users) => {
			setOnlineUsers(users);
		});

		// ─── Global message listener ────────────────────────────
		newSocket.on("newMessage", (message) => {
			const { selectedConversation, addMessage, incrementUnreadCount, updateConversationLastMessage } =
				useConversation.getState();

			const isChatOpen = selectedConversation?._id === message.senderId;

			if (isChatOpen) {
				message.shouldShake = true;
				addMessage(message);
				newSocket.emit("messagesSeen", { senderId: message.senderId });
			} else {
				incrementUnreadCount(message.senderId);
				soundRef.current.currentTime = 0;
				soundRef.current.play().catch(() => {});
			}

			const previewText = message.file?.url
				? message.message?.trim() || (message.file.type === "image" ? "Photo" : "File")
				: message.message?.substring(0, 100);

			updateConversationLastMessage(message.senderId, {
				text: previewText,
				senderId: message.senderId,
				createdAt: message.createdAt,
			});
		});

		// ─── Typing indicators ──────────────────────────────────
		newSocket.on("userTyping", ({ senderId }) => {
			useConversation.getState().setUserTyping(senderId, true);
		});

		newSocket.on("userStopTyping", ({ senderId }) => {
			useConversation.getState().setUserTyping(senderId, false);
		});

		// ─── Message status updates ─────────────────────────────
		newSocket.on("messagesDelivered", ({ to }) => {
			const { messages, setMessages } = useConversation.getState();
			setMessages(
				messages.map((msg) =>
					msg.receiverId === to && msg.status === "sent"
						? { ...msg, status: "delivered" }
						: msg
				)
			);
		});

		newSocket.on("messagesSeen", ({ by }) => {
			const { messages, setMessages } = useConversation.getState();
			setMessages(
				messages.map((msg) =>
					msg.receiverId === by && msg.status !== "seen"
						? { ...msg, status: "seen" }
						: msg
				)
			);
		});

		setSocket(newSocket);

		return () => {
			newSocket.close();
		};
	}, [authUser, setAuthUser]);

	return (
		<SocketContext.Provider value={{ socket, onlineUsers }}>
			{children}
		</SocketContext.Provider>
	);
};
