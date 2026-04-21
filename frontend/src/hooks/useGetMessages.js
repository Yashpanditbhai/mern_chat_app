import { useEffect, useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";

const useGetMessages = () => {
	const [loading, setLoading] = useState(false);
	const { messages, setMessages, selectedConversation } = useConversation();

	useEffect(() => {
		let cancelled = false;

		const getMessages = async () => {
			setLoading(true);
			try {
				const res = await fetch(`/api/messages/${selectedConversation._id}`);
				const data = await res.json();

				if (!res.ok) throw new Error(data.error || "Failed to fetch messages");
				if (cancelled) return;

				setMessages(data.messages || data);
			} catch (error) {
				if (!cancelled) toast.error(error.message);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		if (selectedConversation?._id) getMessages();

		return () => {
			cancelled = true;
		};
	}, [selectedConversation?._id, setMessages]);

	return { messages, loading };
};

export default useGetMessages;
