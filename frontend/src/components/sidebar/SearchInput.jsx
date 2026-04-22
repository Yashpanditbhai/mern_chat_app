import { useState } from "react";
import { IoSearchSharp } from "react-icons/io5";
import useConversation from "../../zustand/useConversation";
import toast from "react-hot-toast";
import { useLanguage } from "../../context/LanguageContext";

const SearchInput = () => {
	const { t } = useLanguage();
	const [search, setSearch] = useState("");
	const { setSelectedConversation, conversations, clearUnreadCount } = useConversation();

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!search.trim()) return;
		if (search.length < 2) {
			return toast.error("Search term must be at least 2 characters");
		}

		const searchLower = search.toLowerCase();
		const conversation = conversations.find(
			(c) =>
				c.fullName.toLowerCase().startsWith(searchLower) ||
				c.username.toLowerCase().startsWith(searchLower)
		);

		if (conversation) {
			setSelectedConversation(conversation);
			clearUnreadCount(conversation._id);
			setSearch("");
		} else {
			toast.error("No user found");
		}
	};

	return (
		<form onSubmit={handleSubmit} className='relative'>
			<IoSearchSharp className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4' />
			<input
				type='text'
				placeholder={t("searchUsers")}
				className='w-full pl-10 pr-4 py-2.5 rounded-xl bg-base-300 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors'
				value={search}
				onChange={(e) => setSearch(e.target.value)}
			/>
		</form>
	);
};

export default SearchInput;
