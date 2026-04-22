import { useEffect, useState, useCallback } from "react";
import useConversation from "../../zustand/useConversation";
import MessageInput from "./MessageInput";
import Messages from "./Messages";
import GroupInfoPanel from "./GroupInfoPanel";
import ForwardModal from "./ForwardModal";
import SearchPanel from "./SearchPanel";
import StarredPanel from "./StarredPanel";
import PollsList from "./PollsList";
import CreatePollModal from "./CreatePollModal";
import ExportChatModal from "./ExportChatModal";
import ScheduledMessagesPanel from "./ScheduledMessagesPanel";
import SharedMediaPanel from "./SharedMediaPanel";
import AIChatPanel from "./AIChatPanel";
import { BsChatDotsFill } from "react-icons/bs";
import { IoPeople, IoSearch, IoStar, IoEllipsisVertical, IoBan, IoVolumeOff, IoVolumeMedium, IoBarChart, IoCall, IoVideocam, IoLockClosed, IoInformationCircle, IoClose, IoDownload, IoTime, IoImages, IoCloudUpload } from "react-icons/io5";
import { useAuthContext } from "../../context/AuthContext";
import { useSocketContext } from "../../context/SocketContext";
import { useCallContext } from "../../context/CallContext";
import { useLanguage } from "../../context/LanguageContext";
import { getProfilePic } from "../../utils/avatar";
import toast from "react-hot-toast";

const MessageContainer = () => {
	const { selectedConversation, setSelectedConversation, clearUnreadCount, typingUsers, blockedUsers, mutedUsers, setBlockedUsers, setMutedUsers } =
		useConversation();
	const { socket, onlineUsers } = useSocketContext();
	const { startCall } = useCallContext();
	const { t } = useLanguage();

	const [showGroupInfo, setShowGroupInfo] = useState(false);
	const [replyingTo, setReplyingTo] = useState(null);
	const [forwardingMessage, setForwardingMessage] = useState(null);
	const [showSearch, setShowSearch] = useState(false);
	const [showStarred, setShowStarred] = useState(false);
	const [showMenu, setShowMenu] = useState(false);
	const [showPolls, setShowPolls] = useState(false);
	const [showCreatePoll, setShowCreatePoll] = useState(false);
	const [showSecurityInfo, setShowSecurityInfo] = useState(false);
	const [showExport, setShowExport] = useState(false);
	const [showScheduled, setShowScheduled] = useState(false);
	const [showMedia, setShowMedia] = useState(false);
	const [isDragOver, setIsDragOver] = useState(false);
	const [droppedFile, setDroppedFile] = useState(null);

	const isGroup = selectedConversation?.isGroupChat;
	const isOnline = !isGroup && selectedConversation
		? onlineUsers.includes(selectedConversation._id)
		: false;
	const isTyping = !isGroup && selectedConversation
		? typingUsers[selectedConversation._id]
		: false;

	const isBlocked = !isGroup && selectedConversation
		? (blockedUsers || []).includes(selectedConversation._id)
		: false;
	const isMuted = !isGroup && selectedConversation
		? (mutedUsers || []).includes(selectedConversation._id)
		: false;

	// Check admin-only messaging
	const { authUser } = useAuthContext();
	const onlyAdminsCanMessage = isGroup && selectedConversation?.settings?.onlyAdminsCanMessage;
	const isAdmin = isGroup && (
		(selectedConversation?.admins || []).some((a) => {
			const aId = a?._id || a;
			return aId?.toString() === authUser._id;
		}) ||
		(selectedConversation?.groupAdmin?._id || selectedConversation?.groupAdmin)?.toString() === authUser._id
	);
	const canMessage = !onlyAdminsCanMessage || isAdmin;

	useEffect(() => {
		if (selectedConversation?._id && socket && !isGroup) {
			clearUnreadCount(selectedConversation._id);
			socket.emit("messagesSeen", { senderId: selectedConversation._id });
		}
	}, [selectedConversation?._id, socket, clearUnreadCount, isGroup]);

	useEffect(() => {
		return () => setSelectedConversation(null);
	}, [setSelectedConversation]);

	// Clear reply when conversation changes
	useEffect(() => {
		setReplyingTo(null);
		setShowMenu(false);
	}, [selectedConversation?._id]);

	const handleBlock = async () => {
		try {
			const res = await fetch(`/api/users/block/${selectedConversation._id}`, { method: "PUT" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			setBlockedUsers(data.blockedUsers);
			toast.success(data.blocked ? "User blocked" : "User unblocked");
		} catch (error) {
			toast.error(error.message);
		}
		setShowMenu(false);
	};

	// ─── Drag & Drop Handlers ─────────────────────────────
	const handleDragOver = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(true);
	}, []);

	const handleDragEnter = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(true);
	}, []);

	const handleDragLeave = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		// Only set false if leaving the container
		if (e.currentTarget && !e.currentTarget.contains(e.relatedTarget)) {
			setIsDragOver(false);
		}
	}, []);

	const handleDrop = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);

		const file = e.dataTransfer?.files?.[0];
		if (file) {
			if (file.size > 10 * 1024 * 1024) {
				toast.error("File too large. Maximum size is 10MB.");
				return;
			}
			setDroppedFile(file);
		}
	}, []);

	const clearDroppedFile = useCallback(() => {
		setDroppedFile(null);
	}, []);

	const handleMute = async () => {
		try {
			const res = await fetch(`/api/users/mute/${selectedConversation._id}`, { method: "PUT" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			setMutedUsers(data.mutedUsers);
			toast.success(data.muted ? "User muted" : "User unmuted");
		} catch (error) {
			toast.error(error.message);
		}
		setShowMenu(false);
	};

	const getLastSeenText = () => {
		if (!selectedConversation?.lastSeen) return "Offline";
		const date = new Date(selectedConversation.lastSeen);
		const now = new Date();
		const diff = now - date;
		const oneDay = 86400000;

		if (diff < oneDay && date.getDate() === now.getDate()) {
			return `last seen at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
		}
		if (diff < 2 * oneDay) {
			return `last seen yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
		}
		return `last seen ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`;
	};

	return (
		<div
			className='flex-1 flex flex-col h-full bg-base-100 relative'
			onDragOver={selectedConversation ? handleDragOver : undefined}
			onDragEnter={selectedConversation ? handleDragEnter : undefined}
			onDragLeave={selectedConversation ? handleDragLeave : undefined}
			onDrop={selectedConversation ? handleDrop : undefined}
		>
			{/* Drag & Drop Overlay */}
			{isDragOver && selectedConversation && (
				<div className='absolute inset-0 z-40 bg-base-100/90 flex items-center justify-center pointer-events-none'>
					<div className='flex flex-col items-center gap-3 p-8 border-2 border-dashed border-primary rounded-2xl'>
						<IoCloudUpload className='w-12 h-12 text-primary animate-bounce' />
						<p className='text-lg font-semibold text-white'>{t("dropFilesHere")}</p>
						<p className='text-sm text-slate-400'>{t("dropFilesDesc")}</p>
					</div>
				</div>
			)}

			{!selectedConversation ? (
				<NoChatSelected />
			) : selectedConversation.isAI ? (
				<AIChatPanel isOpen={true} onClose={() => setSelectedConversation(null)} />
			) : (
				<>
					{/* Chat Header */}
					<div className='px-5 py-3 bg-base-200 border-b border-base-300 flex items-center gap-3'>
						{isGroup ? (
							<div
								className='flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity'
								onClick={() => setShowGroupInfo(true)}
								title='View group info'
							>
								<div className='w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center'>
									<IoPeople className='w-5 h-5 text-primary' />
								</div>
								<div>
									<h3 className='font-semibold text-white text-sm'>
										{selectedConversation.groupName}
									</h3>
									<p className='text-xs text-slate-400'>
										{selectedConversation.participants?.length || 0} members · tap for info
									</p>
								</div>
							</div>
						) : (
							<>
								<div className='relative'>
									<div className='w-10 h-10 rounded-full overflow-hidden'>
										<img
											src={getProfilePic(selectedConversation)}
											alt={selectedConversation.fullName}
											className='w-full h-full object-cover'
										/>
									</div>
									{isOnline && (
										<span className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-base-200 rounded-full' />
									)}
								</div>
								<div>
									<div className='flex items-center gap-2'>
										<h3 className='font-semibold text-white text-sm'>
											{selectedConversation.fullName}
										</h3>
										{isBlocked && (
											<span className='text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full'>{t("blocked")}</span>
										)}
									</div>
									<p className='text-xs'>
										{isTyping ? (
											<span className='text-green-400 font-medium'>{t("typing")}</span>
										) : isOnline ? (
											<span className='text-green-400'>{t("online")}</span>
										) : (
											<span className='text-slate-500'>{getLastSeenText()}</span>
										)}
									</p>
									{selectedConversation.statusText && !isTyping && (
										<p className='text-xs text-slate-400 truncate max-w-[200px]'>
											{selectedConversation.statusText}
										</p>
									)}
								</div>
							</>
						)}

						{/* E2E Encryption Indicator */}
						<div className='ml-auto flex items-center gap-1'>
							<button
								onClick={() => setShowSecurityInfo(true)}
								className='p-1.5 rounded-lg text-green-500 hover:bg-base-300 transition-colors flex items-center gap-1'
								title={t("messagesSecured")}
							>
								<IoLockClosed className='w-3.5 h-3.5' />
							</button>

							{/* Call buttons (1-to-1 only) */}
							{!isGroup && (
								<>
									<button
										onClick={() => startCall(selectedConversation, "audio")}
										className='p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-base-300 transition-colors'
										title={t("audioCall")}
									>
										<IoCall className='w-4 h-4' />
									</button>
									<button
										onClick={() => startCall(selectedConversation, "video")}
										className='p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-base-300 transition-colors'
										title={t("videoCall")}
									>
										<IoVideocam className='w-4 h-4' />
									</button>
								</>
							)}

							{isGroup && (
								<button
									onClick={() => setShowPolls(true)}
									className='p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-base-300 transition-colors'
									title={t("polls")}
								>
									<IoBarChart className='w-4 h-4' />
								</button>
							)}
							<button
								onClick={() => setShowSearch(true)}
								className='p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-base-300 transition-colors'
								title={t("searchMessages")}
							>
								<IoSearch className='w-4 h-4' />
							</button>
							<button
								onClick={() => setShowStarred(true)}
								className='p-2 rounded-lg text-slate-400 hover:text-yellow-400 hover:bg-base-300 transition-colors'
								title={t("starredMessages")}
							>
								<IoStar className='w-4 h-4' />
							</button>
							<button
								onClick={() => setShowMedia(true)}
								className='p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-base-300 transition-colors'
								title={t("sharedMedia")}
							>
								<IoImages className='w-4 h-4' />
							</button>
							{!isGroup && (
								<div className='relative'>
									<button
										onClick={() => setShowMenu((p) => !p)}
										className='p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-base-300 transition-colors'
										title={t("moreOptions")}
									>
										<IoEllipsisVertical className='w-4 h-4' />
									</button>
									{showMenu && (
										<div className='absolute right-0 top-full mt-1 bg-base-300 rounded-xl shadow-lg z-20 min-w-[180px] py-1 overflow-hidden'>
											<button
												onClick={() => { setShowExport(true); setShowMenu(false); }}
												className='w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-base-100 transition-colors'
											>
												<IoDownload className='w-4 h-4' />
												{t("exportChat")}
											</button>
											<button
												onClick={() => { setShowScheduled(true); setShowMenu(false); }}
												className='w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-base-100 transition-colors'
											>
												<IoTime className='w-4 h-4' />
												{t("scheduledMessages")}
											</button>
											<button
												onClick={handleBlock}
												className='w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-base-100 transition-colors'
											>
												<IoBan className='w-4 h-4' />
												{isBlocked ? t("unblock") : t("block")}
											</button>
											<button
												onClick={handleMute}
												className='w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-base-100 transition-colors'
											>
												{isMuted ? <IoVolumeMedium className='w-4 h-4' /> : <IoVolumeOff className='w-4 h-4' />}
												{isMuted ? t("unmute") : t("mute")}
											</button>
										</div>
									)}
								</div>
							)}
						</div>
					</div>

					{/* Messages */}
					<Messages
						onReply={(msg) => setReplyingTo(msg)}
						onForward={(msg) => setForwardingMessage(msg)}
					/>

					{/* Input */}
					{isBlocked ? (
						<div className='bg-base-200 border-t border-base-300 px-4 py-4'>
							<p className='text-center text-sm text-red-400'>You have blocked this user. Unblock to send messages.</p>
						</div>
					) : !canMessage ? (
						<div className='bg-base-200 border-t border-base-300 px-4 py-4'>
							<div className='flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-base-300 border border-slate-700'>
								<IoBan className='w-4 h-4 text-slate-500' />
								<p className='text-sm text-slate-500'>Only admins can send messages in this group</p>
							</div>
						</div>
					) : (
						<MessageInput
							replyingTo={replyingTo}
							onCancelReply={() => setReplyingTo(null)}
							onCreatePoll={isGroup ? () => setShowCreatePoll(true) : undefined}
							droppedFile={droppedFile}
							onClearDroppedFile={clearDroppedFile}
						/>
					)}

					{/* Group Info Panel */}
					{isGroup && (
						<GroupInfoPanel
							isOpen={showGroupInfo}
							onClose={() => setShowGroupInfo(false)}
							group={selectedConversation}
						/>
					)}

					{/* Forward Modal */}
					<ForwardModal
						isOpen={!!forwardingMessage}
						onClose={() => setForwardingMessage(null)}
						message={forwardingMessage}
					/>

					{/* Search Panel */}
					<SearchPanel
						isOpen={showSearch}
						onClose={() => setShowSearch(false)}
						conversationId={!isGroup ? selectedConversation?._id : null}
					/>

					{/* Starred Panel */}
					<StarredPanel
						isOpen={showStarred}
						onClose={() => setShowStarred(false)}
					/>

					{/* Polls Panel */}
					{isGroup && (
						<PollsList
							isOpen={showPolls}
							onClose={() => setShowPolls(false)}
							conversationId={selectedConversation._id}
						/>
					)}

					{/* Create Poll Modal */}
					{isGroup && (
						<CreatePollModal
							isOpen={showCreatePoll}
							onClose={() => setShowCreatePoll(false)}
							conversationId={selectedConversation._id}
						/>
					)}

					{/* Export Chat Modal */}
					<ExportChatModal
						isOpen={showExport}
						onClose={() => setShowExport(false)}
					/>

					{/* Scheduled Messages Panel */}
					<ScheduledMessagesPanel
						isOpen={showScheduled}
						onClose={() => setShowScheduled(false)}
					/>

					{/* Shared Media Panel */}
					<SharedMediaPanel
						isOpen={showMedia}
						onClose={() => setShowMedia(false)}
					/>

					{/* Security Info Modal */}
					{showSecurityInfo && (
						<div className='fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4' onClick={() => setShowSecurityInfo(false)}>
							<div className='bg-base-200 rounded-2xl w-full max-w-sm p-6 relative' onClick={(e) => e.stopPropagation()}>
								<button
									onClick={() => setShowSecurityInfo(false)}
									className='absolute top-3 right-3 p-1.5 hover:bg-base-300 rounded-full transition-colors'
								>
									<IoClose className='w-5 h-5 text-slate-400' />
								</button>
								<div className='flex items-center gap-3 mb-4'>
									<div className='w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center'>
										<IoLockClosed className='w-5 h-5 text-green-500' />
									</div>
									<h3 className='text-lg font-semibold text-white'>{t("securityInfo")}</h3>
								</div>
								<p className='text-sm text-slate-300 leading-relaxed'>
									{t("securityDesc")}
								</p>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default MessageContainer;

const NoChatSelected = () => {
	const { authUser } = useAuthContext();
	const { t } = useLanguage();
	return (
		<div className='flex-1 flex items-center justify-center'>
			<div className='text-center'>
				<div className='inline-flex items-center justify-center w-20 h-20 rounded-full bg-base-200 mb-4'>
					<BsChatDotsFill className='w-10 h-10 text-slate-600' />
				</div>
				<h2 className='text-xl font-semibold text-white mb-2'>
					{t("welcome")}, {authUser?.fullName}
				</h2>
				<p className='text-slate-500 text-sm max-w-xs'>
					{t("selectConversation")}
				</p>
			</div>
		</div>
	);
};
