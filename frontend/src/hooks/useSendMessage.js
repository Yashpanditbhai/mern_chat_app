import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";

const useSendMessage = () => {
	const [loading, setLoading] = useState(false);
	const { selectedConversation, addMessage } = useConversation();

	const sendMessage = async (message, file = null) => {
		if (!selectedConversation?._id) {
			return toast.error("No conversation selected");
		}
		if (!message?.trim() && !file) return;

		setLoading(true);
		try {
			// Use FormData to support file uploads
			const formData = new FormData();
			if (message?.trim()) {
				formData.append("message", message);
			}
			if (file) {
				formData.append("file", file);
			}

			const res = await fetch(`/api/messages/send/${selectedConversation._id}`, {
				method: "POST",
				body: formData,
				// Don't set Content-Type — browser sets it with boundary for FormData
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
