import { create } from "zustand";

const useConversation = create((set) => ({
	selectedConversation: null,
	setSelectedConversation: (selectedConversation) => set({ selectedConversation }),

	messages: [],
	setMessages: (messages) => set({ messages }),
	// Functional append — avoids stale closure bugs
	addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

	// Unread counts per userId
	unreadCounts: {},
	setUnreadCount: (userId, count) =>
		set((state) => ({
			unreadCounts: { ...state.unreadCounts, [userId]: count },
		})),
	incrementUnreadCount: (userId) =>
		set((state) => ({
			unreadCounts: {
				...state.unreadCounts,
				[userId]: (state.unreadCounts[userId] || 0) + 1,
			},
		})),
	clearUnreadCount: (userId) =>
		set((state) => ({
			unreadCounts: { ...state.unreadCounts, [userId]: 0 },
		})),

	// Typing indicator state: { userId: true/false }
	typingUsers: {},
	setUserTyping: (userId, isTyping) =>
		set((state) => ({
			typingUsers: { ...state.typingUsers, [userId]: isTyping },
		})),

	// Conversations list for sidebar (users with metadata)
	conversations: [],
	setConversations: (conversations) => set({ conversations }),
	updateConversationLastMessage: (userId, lastMessage) =>
		set((state) => ({
			conversations: state.conversations.map((conv) =>
				conv._id === userId
					? { ...conv, lastMessage }
					: conv
			),
		})),
}));

export default useConversation;
