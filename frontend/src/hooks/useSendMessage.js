import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";

const useSendMessage = () => {
	const [loading, setLoading] = useState(false);
	const { selectedConversation, addMessage } = useConversation();

	const sendMessage = async (message, file = null, replyToId = null) => {
		if (!selectedConversation?._id) {
			return toast.error("No conversation selected");
		}
		if (!message?.trim() && !file) return;

		setLoading(true);
		try {
			const formData = new FormData();
			if (message?.trim()) {
				formData.append("message", message);
			}
			if (file) {
				formData.append("file", file);
			}
			if (replyToId) {
				formData.append("replyToId", replyToId);
			}

			const isGroup = selectedConversation?.isGroupChat;
			const url = isGroup
				? `/api/messages/send/group/${selectedConversation._id}`
				: `/api/messages/send/${selectedConversation._id}`;

			const res = await fetch(url, {
				method: "POST",
				body: formData,
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to send message");

			addMessage(data);
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};

	return { sendMessage, loading };
};

export default useSendMessage;
