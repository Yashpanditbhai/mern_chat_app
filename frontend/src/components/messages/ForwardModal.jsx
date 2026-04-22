import { useState } from "react";
import { IoClose, IoSearch } from "react-icons/io5";
import { getProfilePic } from "../../utils/avatar";
import useConversation from "../../zustand/useConversation";
import toast from "react-hot-toast";

const ForwardModal = ({ isOpen, onClose, message }) => {
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(false);
	const { conversations } = useConversation();

	const filteredUsers = conversations.filter(
		(user) =>
			user.fullName.toLowerCase().includes(search.toLowerCase()) ||
			user.username.toLowerCase().includes(search.toLowerCase())
	);

	const toggleUser = (userId) => {
		setSelectedUsers((prev) =>
			prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
		);
	};

	const handleForward = async () => {
		if (selectedUsers.length === 0) return;
		setLoading(true);
		try {
			const res = await fetch(`/api/messages/forward/${message._id}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ receiverIds: selectedUsers }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			toast.success(`Forwarded to ${data.forwarded} user(s)`);
			setSelectedUsers([]);
			setSearch("");
			onClose();
		} catch (error) {
			toast.error(error.message || "Failed to forward");
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen || !message) return null;

	return (
		<div className='fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4' onClick={onClose}>
			<div
				className='bg-base-200 rounded-2xl w-full max-w-sm max-h-[70vh] flex flex-col'
				onClick={(e) => e.stopPropagation()}
			>
				<div className='flex items-center justify-between p-4 pb-2'>
					<h3 className='text-lg font-semibold text-white'>Forward Message</h3>
					<button onClick={onClose} className='p-1.5 hover:bg-base-300 rounded-full transition-colors'>
						<IoClose className='w-5 h-5 text-slate-400' />
					</button>
				</div>

				{/* Message preview */}
				<div className='mx-4 mb-3 px-3 py-2 bg-base-300 rounded-lg'>
					<p className='text-xs text-slate-400 truncate'>
						{message.message || (message.file?.url ? `📎 ${message.file.name}` : "")}
					</p>
				</div>

				{/* Search */}
				<div className='px-4 mb-2'>
					<div className='relative'>
						<IoSearch className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500' />
						<input
							type='text'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder='Search users...'
							className='w-full pl-9 pr-3 py-2 rounded-lg bg-base-300 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors'
						/>
					</div>
				</div>

				{/* User list */}
				<div className='flex-1 overflow-y-auto px-2'>
					{filteredUsers.map((user) => (
						<div
							key={user._id}
							onClick={() => toggleUser(user._id)}
							className='flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-base-300 transition-colors'
						>
							<div className='w-9 h-9 rounded-full overflow-hidden flex-shrink-0'>
								<img src={getProfilePic(user)} alt={user.fullName} className='w-full h-full object-cover' />
							</div>
							<p className='text-sm text-white flex-1 truncate'>{user.fullName}</p>
							<input
								type='checkbox'
								checked={selectedUsers.includes(user._id)}
								readOnly
								className='checkbox checkbox-primary checkbox-sm'
							/>
						</div>
					))}
				</div>

				{/* Forward button */}
				<div className='p-4 pt-2'>
					<button
						onClick={handleForward}
						disabled={loading || selectedUsers.length === 0}
						className='w-full py-2.5 rounded-xl bg-primary hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50'
					>
						{loading ? (
							<span className='loading loading-spinner loading-sm'></span>
						) : (
							`Forward (${selectedUsers.length})`
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ForwardModal;
