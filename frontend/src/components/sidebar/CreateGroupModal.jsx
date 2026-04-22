import { useState } from "react";
import { IoClose, IoSearch } from "react-icons/io5";
import { getProfilePic } from "../../utils/avatar";
import useConversation from "../../zustand/useConversation";
import toast from "react-hot-toast";

const CreateGroupModal = ({ isOpen, onClose }) => {
	const [groupName, setGroupName] = useState("");
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(false);
	const { conversations, groups, setGroups } = useConversation();

	const filteredUsers = conversations.filter(
		(user) =>
			(user.fullName.toLowerCase().includes(search.toLowerCase()) ||
				user.username.toLowerCase().includes(search.toLowerCase())) &&
			!selectedUsers.some((s) => s._id === user._id)
	);

	const toggleUser = (user) => {
		setSelectedUsers((prev) =>
			prev.some((u) => u._id === user._id)
				? prev.filter((u) => u._id !== user._id)
				: [...prev, user]
		);
	};

	const handleCreate = async () => {
		if (!groupName.trim()) {
			toast.error("Group name is required");
			return;
		}
		if (selectedUsers.length < 1) {
			toast.error("Select at least 1 user");
			return;
		}

		setLoading(true);
		try {
			const res = await fetch("/api/groups", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					groupName: groupName.trim(),
					participants: selectedUsers.map((u) => u._id),
				}),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			setGroups([data, ...(groups || [])]);
			toast.success("Group created");
			setGroupName("");
			setSelectedUsers([]);
			setSearch("");
			onClose();
		} catch (error) {
			toast.error(error.message || "Failed to create group");
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4' onClick={onClose}>
			<div
				className='bg-base-200 rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col relative'
				onClick={(e) => e.stopPropagation()}
			>
				<button
					onClick={onClose}
					className='absolute top-3 right-3 p-1.5 hover:bg-base-300 rounded-full transition-colors z-10'
				>
					<IoClose className='w-5 h-5 text-slate-400' />
				</button>

				<div className='p-5 pb-3'>
					<h3 className='text-lg font-semibold text-white mb-4'>New Group</h3>

					{/* Group name */}
					<input
						type='text'
						value={groupName}
						onChange={(e) => setGroupName(e.target.value)}
						placeholder='Group name'
						maxLength={100}
						className='w-full px-3 py-2.5 rounded-lg bg-base-300 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors mb-3'
					/>

					{/* Selected users chips */}
					{selectedUsers.length > 0 && (
						<div className='flex flex-wrap gap-1.5 mb-3'>
							{selectedUsers.map((user) => (
								<span
									key={user._id}
									className='flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary text-xs rounded-full'
								>
									{user.fullName}
									<button onClick={() => toggleUser(user)} className='hover:text-white'>
										<IoClose className='w-3 h-3' />
									</button>
								</span>
							))}
						</div>
					)}

					{/* Search users */}
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
				<div className='flex-1 overflow-y-auto px-2 pb-2'>
					{filteredUsers.map((user) => (
						<div
							key={user._id}
							onClick={() => toggleUser(user)}
							className='flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-base-300 transition-colors'
						>
							<div className='w-9 h-9 rounded-full overflow-hidden flex-shrink-0'>
								<img src={getProfilePic(user)} alt={user.fullName} className='w-full h-full object-cover' />
							</div>
							<div className='flex-1 min-w-0'>
								<p className='text-sm text-white truncate'>{user.fullName}</p>
								<p className='text-xs text-slate-400'>@{user.username}</p>
							</div>
							<input
								type='checkbox'
								checked={selectedUsers.some((u) => u._id === user._id)}
								readOnly
								className='checkbox checkbox-primary checkbox-sm'
							/>
						</div>
					))}
				</div>

				{/* Create button */}
				<div className='p-4 pt-2'>
					<button
						onClick={handleCreate}
						disabled={loading || !groupName.trim() || selectedUsers.length < 1}
						className='w-full py-2.5 rounded-xl bg-primary hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50'
					>
						{loading ? (
							<span className='loading loading-spinner loading-sm'></span>
						) : (
							`Create Group (${selectedUsers.length} members)`
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export default CreateGroupModal;
