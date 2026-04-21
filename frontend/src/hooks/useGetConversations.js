import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useConversation from "../zustand/useConversation";

const useGetConversations = () => {
	const [loading, setLoading] = useState(false);
	const { conversations, setConversations, setUnreadCount } = useConversation();

	useEffect(() => {
		let cancelled = false;

		const getConversations = async () => {
			setLoading(true);
			try {
				const res = await fetch("/api/users");
				const data = await res.json();

				if (!res.ok) throw new Error(data.error || "Failed to fetch users");
				if (cancelled) return;

				setConversations(data);

				// Initialize unread counts from server data
				data.forEach((user) => {
					if (user.unreadCount > 0) {
						setUnreadCount(user._id, user.unreadCount);
					}
				});
			} catch (error) {
				if (!cancelled) toast.error(error.message);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		getConversations();

		return () => {
			cancelled = true;
		};
	}, [setConversations, setUnreadCount]);

	return { loading, conversations };
};

export default useGetConversations;
