import { useState } from "react";
import { IoClose, IoPeople, IoExitOutline, IoShieldCheckmark } from "react-icons/io5";
import { RiShieldStarLine } from "react-icons/ri";
import { useAuthContext } from "../../context/AuthContext";
import { useSocketContext } from "../../context/SocketContext";
import { getProfilePic } from "../../utils/avatar";
import useConversation from "../../zustand/useConversation";
import toast from "react-hot-toast";

const GroupInfoPanel = ({ isOpen, onClose, group }) => {
	const { authUser } = useAuthContext();
	const { onlineUsers } = useSocketContext();
	const { setSelectedConversation, groups, setGroups, updateGroup } = useConversation();
	const [loadingSettings, setLoadingSettings] = useState(false);

	if (!isOpen || !group) return null;

	const participants = group.participants || [];
	const adminId = group.groupAdmin?._id || group.groupAdmin;
	const isCreator = adminId?.toString() === authUser._id;
	const admins = group.admins || [];
	const adminIds = admins.map((a) => (a?._id || a)?.toString());
	const isAdmin = isCreator || adminIds.includes(authUser._id);
	const onlineCount = participants.filter((p) => onlineUsers.includes(p._id)).length;
	const onlyAdminsCanMessage = group.settings?.onlyAdminsCanMessage || false;

	const handleLeaveGroup = async () => {
		if (!confirm("Are you sure you want to leave this group?")) return;
		try {
			const res = await fetch(`/api/groups/${group._id}/leave`, { method: "POST" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			setGroups(groups.filter((g) => g._id !== group._id));
			setSelectedConversation(null);
			toast.success("Left group");
			onClose();
		} catch (error) {
			toast.error(error.message || "Failed to leave group");
		}
	};

	const handleToggleAdminOnly = async () => {
		setLoadingSettings(true);
		try {
			const res = await fetch(`/api/groups/${group._id}/settings`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ onlyAdminsCanMessage: !onlyAdminsCanMessage }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			updateGroup(data);
			toast.success(data.settings?.onlyAdminsCanMessage ? "Only admins can message now" : "All members can message now");
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoadingSettings(false);
		}
	};

	const handleMakeAdmin = async (memberId) => {
		try {
			const res = await fetch(`/api/groups/${group._id}/make-admin/${memberId}`, { method: "POST" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			updateGroup(data);
			toast.success("Admin status updated");
		} catch (error) {
			toast.error(error.message);
		}
	};

	return (
		<div className='fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4' onClick={onClose}>
			<div
				className='bg-base-200 rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col'
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className='flex items-center justify-between p-5 pb-3'>
					<h3 className='text-lg font-semibold text-white'>Group Info</h3>
					<button
						onClick={onClose}
						className='p-1.5 hover:bg-base-300 rounded-full transition-colors'
					>
						<IoClose className='w-5 h-5 text-slate-400' />
					</button>
				</div>

				{/* Group info */}
				<div className='flex flex-col items-center px-5 pb-4 border-b border-base-300'>
					<div className='w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-3'>
						<IoPeople className='w-10 h-10 text-primary' />
					</div>
					<h2 className='text-white font-semibold text-lg'>{group.groupName}</h2>
					<p className='text-xs text-slate-400 mt-1'>
						{participants.length} members · {onlineCount} online
					</p>
				</div>

				{/* Settings (for admins) */}
				{isAdmin && (
					<div className='px-5 py-3 border-b border-base-300'>
						<p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>Settings</p>
						<label className='flex items-center justify-between cursor-pointer'>
							<div className='flex items-center gap-2'>
								<IoShieldCheckmark className='w-4 h-4 text-slate-400' />
								<span className='text-sm text-slate-300'>Only admins can message</span>
							</div>
							<input
								type='checkbox'
								className='toggle toggle-sm toggle-primary'
								checked={onlyAdminsCanMessage}
								onChange={handleToggleAdminOnly}
								disabled={loadingSettings}
							/>
						</label>
					</div>
				)}

				{/* Members list */}
				<div className='px-3 py-2'>
					<p className='text-xs font-semibold text-slate-500 uppercase tracking-wide px-2 mb-2'>
						Members ({participants.length})
					</p>
				</div>
				<div className='flex-1 overflow-y-auto px-3 pb-3'>
					{participants.map((member) => {
						const memberId = member._id || member;
						const memberIdStr = memberId?.toString();
						const isOnline = onlineUsers.includes(memberId);
						const isMemberAdmin = adminId?.toString() === memberIdStr || adminIds.includes(memberIdStr);
						const isMe = memberIdStr === authUser._id;
						const isMemberCreator = adminId?.toString() === memberIdStr;

						return (
							<div
								key={memberId}
								className='flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-base-300 transition-colors'
							>
								<div className='relative flex-shrink-0'>
									<div className='w-10 h-10 rounded-full overflow-hidden'>
										<img
											src={getProfilePic(member)}
											alt={member.fullName || "User"}
											className='w-full h-full object-cover'
										/>
									</div>
									{isOnline && (
										<span className='absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-base-200 rounded-full' />
									)}
								</div>

								<div className='flex-1 min-w-0'>
									<div className='flex items-center gap-1.5'>
										<p className='text-sm text-white truncate'>
											{member.fullName || "Unknown"}
											{isMe && <span className='text-slate-400'> (You)</span>}
										</p>
									</div>
									<p className='text-xs text-slate-400'>
										{member.statusText || `@${member.username || ""}`}
									</p>
								</div>

								<div className='flex items-center gap-1 flex-shrink-0'>
									{isMemberAdmin && (
										<span className='flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[10px] font-medium rounded-full'>
											<RiShieldStarLine className='w-3 h-3' />
											{isMemberCreator ? "Creator" : "Admin"}
										</span>
									)}
									{isCreator && !isMe && !isMemberCreator && (
										<button
											onClick={() => handleMakeAdmin(memberIdStr)}
											className={`p-1 rounded-full transition-colors ${isMemberAdmin ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-slate-500 hover:bg-base-100'}`}
											title={isMemberAdmin ? "Remove admin" : "Make admin"}
										>
											<RiShieldStarLine className='w-4 h-4' />
										</button>
									)}
								</div>
							</div>
						);
					})}
				</div>

				{/* Leave group button */}
				<div className='p-4 pt-2 border-t border-base-300'>
					<button
						onClick={handleLeaveGroup}
						className='w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 transition-colors'
					>
						<IoExitOutline className='w-5 h-5' />
						Leave Group
					</button>
				</div>
			</div>
		</div>
	);
};

export default GroupInfoPanel;
