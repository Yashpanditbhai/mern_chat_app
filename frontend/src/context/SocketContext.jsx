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

const SOCKET_URL = import.meta.env.MODE === "development" ? "http://localhost:5002" : "";

export const SocketContextProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const { authUser, setAuthUser } = useAuthContext();
	const soundRef = useRef(new Audio(notificationSound));

	// Fetch blocked/muted users on mount
	useEffect(() => {
		if (!authUser) return;
		const fetchBlockedMuted = async () => {
			try {
				const res = await fetch("/api/users/blocked-muted");
				const data = await res.json();
				if (res.ok) {
					useConversation.getState().setBlockedUsers(data.blockedUsers || []);
					useConversation.getState().setMutedUsers(data.mutedUsers || []);
				}
			} catch (error) {
				console.error("Failed to fetch blocked/muted users:", error);
			}
		};
		fetchBlockedMuted();
	}, [authUser]);

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
			transports: ["websocket", "polling"],
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
			const { selectedConversation, addMessage, incrementUnreadCount, updateConversationLastMessage, mutedUsers } =
				useConversation.getState();

			const isChatOpen = selectedConversation?._id === message.senderId;

			if (isChatOpen) {
				message.shouldShake = true;
				addMessage(message);
				newSocket.emit("messagesSeen", { senderId: message.senderId });
			} else {
				incrementUnreadCount(message.senderId);
				// Don't play sound for muted users
				const isMuted = (mutedUsers || []).includes(message.senderId);
				if (!isMuted) {
					soundRef.current.currentTime = 0;
					soundRef.current.play().catch(() => {});
				}
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

		// ─── Message reactions ──────────────────────────────────
		newSocket.on("messageReaction", ({ messageId, reactions }) => {
			const { messages, setMessages } = useConversation.getState();
			setMessages(
				messages.map((msg) =>
					msg._id === messageId ? { ...msg, reactions } : msg
				)
			);
		});

		// ─── Message deleted ────────────────────────────────────
		newSocket.on("messageDeleted", ({ messageId, deletedForEveryone }) => {
			if (deletedForEveryone) {
				const { messages, setMessages } = useConversation.getState();
				setMessages(
					messages.map((msg) =>
						msg._id === messageId
							? { ...msg, deletedForEveryone: true, message: "", file: undefined }
							: msg
					)
				);
			}
		});

		// ─── Message pinned ─────────────────────────────────────
		newSocket.on("messagePinned", ({ messageId, isPinned }) => {
			const { messages, setMessages } = useConversation.getState();
			setMessages(
				messages.map((msg) =>
					msg._id === messageId ? { ...msg, isPinned } : msg
				)
			);
		});

		// ─── Profile updates ────────────────────────────────────
		newSocket.on("userProfileUpdated", ({ userId, profilePic, statusText }) => {
			const { conversations, setConversations } = useConversation.getState();
			setConversations(
				conversations.map((conv) =>
					conv._id === userId
						? { ...conv, profilePic, statusText }
						: conv
				)
			);
		});

		// ─── Group messages ─────────────────────────────────
		newSocket.on("newGroupMessage", (message) => {
			const { selectedConversation, addMessage, updateGroupLastMessage } =
				useConversation.getState();

			const isGroupOpen =
				selectedConversation?.isGroupChat &&
				selectedConversation?._id === message.conversationId;

			if (isGroupOpen) {
				message.shouldShake = true;
				addMessage(message);
			} else {
				soundRef.current.currentTime = 0;
				soundRef.current.play().catch(() => {});
			}

			const previewText = message.file?.url
				? message.message?.trim() || "File"
				: message.message?.substring(0, 100);

			updateGroupLastMessage(message.conversationId, {
				text: previewText,
				senderId: message.senderId,
				senderName: message.senderName || "",
				createdAt: message.createdAt,
			});
		});

		// ─── New group created ──────────────────────────────
		newSocket.on("newGroup", (group) => {
			const { groups, setGroups } = useConversation.getState();
			const exists = groups.some((g) => g._id === group._id);
			if (!exists) {
				setGroups([group, ...groups]);
			}
		});

		// ─── Group updated ──────────────────────────────────
		newSocket.on("groupUpdated", (updatedGroup) => {
			if (updatedGroup && updatedGroup._id) {
				useConversation.getState().updateGroup(updatedGroup);
			}
		});

		// ─── Poll events ────────────────────────────────────
		newSocket.on("newPoll", (poll) => {
			const { selectedConversation, addPoll } = useConversation.getState();
			if (selectedConversation?.isGroupChat && selectedConversation?._id === poll.conversationId) {
				addPoll(poll);
			}
		});

		newSocket.on("pollVoted", (poll) => {
			const { selectedConversation, updatePoll } = useConversation.getState();
			if (selectedConversation?.isGroupChat && selectedConversation?._id === poll.conversationId) {
				updatePoll(poll);
			}
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
