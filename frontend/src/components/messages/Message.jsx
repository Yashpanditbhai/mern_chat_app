import { useState, useMemo, useRef, useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { extractTime } from "../../utils/extractTime";
import useConversation from "../../zustand/useConversation";
import { getProfilePic } from "../../utils/avatar";
import { IoDocumentText, IoDownload, IoMic, IoArrowUndo, IoTrash, IoArrowRedo, IoPin, IoStar, IoStarOutline } from "react-icons/io5";
import ImagePreviewModal from "./ImagePreviewModal";
import LinkPreview, { extractUrls } from "./LinkPreview";
import toast from "react-hot-toast";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const Message = ({ message, onReply, onForward }) => {
	const { authUser } = useAuthContext();
	const { selectedConversation, messages: allMessages, setMessages } = useConversation();
	const [showActions, setShowActions] = useState(false);
	const [showReactions, setShowReactions] = useState(false);
	const actionsRef = useRef(null);

	const fromMe = message.senderId === authUser._id || message.senderId?._id === authUser._id;
	const isGroup = selectedConversation?.isGroupChat;
	const formattedTime = extractTime(message.createdAt);
	const shakeClass = message.shouldShake ? "shake" : "";
	const isDeleted = message.deletedForEveryone;
	const hasFile = !isDeleted && message.file?.url;
	const hasText = !isDeleted && message.message && message.message.trim().length > 0;

	let profilePic, senderName;
	if (fromMe) {
		profilePic = getProfilePic(authUser);
		senderName = authUser.fullName;
	} else if (isGroup && message.senderId && typeof message.senderId === "object") {
		profilePic = getProfilePic(message.senderId);
		senderName = message.senderId.fullName;
	} else if (isGroup && message.senderName) {
		senderName = message.senderName;
		profilePic = getProfilePic(selectedConversation);
	} else {
		profilePic = getProfilePic(selectedConversation);
		senderName = selectedConversation?.fullName;
	}

	const allImages = useMemo(() => {
		return allMessages
			.filter((msg) => msg.file?.type === "image" && msg.file?.url && !msg.deletedForEveryone)
			.map((msg) => ({ url: msg.file.url, name: msg.file.name }));
	}, [allMessages]);

	// Close actions on outside click
	useEffect(() => {
		const handle = (e) => {
			if (actionsRef.current && !actionsRef.current.contains(e.target)) {
				setShowActions(false);
				setShowReactions(false);
			}
		};
		if (showActions || showReactions) document.addEventListener("mousedown", handle);
		return () => document.removeEventListener("mousedown", handle);
	}, [showActions, showReactions]);

	const handleReact = async (emoji) => {
		try {
			const res = await fetch(`/api/messages/react/${message._id}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ emoji }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			// Update handled by socket event
		} catch (error) {
			toast.error(error.message);
		}
		setShowReactions(false);
		setShowActions(false);
	};

	const handleDelete = async (forEveryone) => {
		try {
			const res = await fetch(`/api/messages/delete/${message._id}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ deleteForEveryone: forEveryone }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			if (!forEveryone) {
				// Remove from local state
				setMessages(allMessages.filter((m) => m._id !== message._id));
			}
			toast.success("Message deleted");
		} catch (error) {
			toast.error(error.message);
		}
		setShowActions(false);
	};

	const handlePin = async () => {
		try {
			const res = await fetch(`/api/messages/pin/${message._id}`, { method: "POST" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			toast.success(data.isPinned ? "Message pinned" : "Message unpinned");
		} catch (error) {
			toast.error(error.message);
		}
		setShowActions(false);
	};

	const handleStar = async () => {
		try {
			const res = await fetch(`/api/messages/star/${message._id}`, { method: "POST" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			// Update local state
			setMessages(
				allMessages.map((m) => {
					if (m._id !== message._id) return m;
					const starredBy = m.starredBy || [];
					return {
						...m,
						starredBy: data.starred
							? [...starredBy, authUser._id]
							: starredBy.filter((id) => id !== authUser._id),
					};
				})
			);
		} catch (error) {
			toast.error(error.message);
		}
		setShowActions(false);
	};

	const isStarred = (message.starredBy || []).includes(authUser._id);
	const reactions = message.reactions || [];
	const groupedReactions = reactions.reduce((acc, r) => {
		acc[r.emoji] = (acc[r.emoji] || 0) + 1;
		return acc;
	}, {});

	return (
		<div
			className={`group flex items-end gap-2 mb-2 ${fromMe ? "flex-row-reverse" : ""}`}
			onContextMenu={(e) => {
				if (!isDeleted) {
					e.preventDefault();
					setShowActions(true);
				}
			}}
		>
			{/* Avatar */}
			<div className='w-8 h-8 rounded-full overflow-hidden flex-shrink-0'>
				<img src={profilePic} alt='avatar' className='w-full h-full object-cover' />
			</div>

			{/* Bubble */}
			<div className={`max-w-[70%] relative ${fromMe ? "items-end" : "items-start"}`} ref={actionsRef}>
				{/* Hover action buttons */}
				{!isDeleted && (
					<div className={`absolute top-0 ${fromMe ? "left-0 -translate-x-full" : "right-0 translate-x-full"} flex items-center gap-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
						<button
							onClick={() => setShowReactions(true)}
							className='p-1 text-slate-500 hover:text-slate-300 text-xs'
							title='React'
						>
							😊
						</button>
						<button
							onClick={() => onReply?.(message)}
							className='p-1 text-slate-500 hover:text-slate-300'
							title='Reply'
						>
							<IoArrowUndo className='w-3.5 h-3.5' />
						</button>
						<button
							onClick={() => setShowActions(true)}
							className='p-1 text-slate-500 hover:text-slate-300 text-xs'
							title='More'
						>
							⋯
						</button>
					</div>
				)}

				{/* Quick reaction picker */}
				{showReactions && (
					<div className={`absolute bottom-full mb-1 ${fromMe ? "right-0" : "left-0"} bg-base-300 rounded-xl px-2 py-1.5 flex items-center gap-1 shadow-lg z-20`}>
						{QUICK_REACTIONS.map((emoji) => (
							<button
								key={emoji}
								onClick={() => handleReact(emoji)}
								className='text-lg hover:scale-125 transition-transform p-0.5'
							>
								{emoji}
							</button>
						))}
					</div>
				)}

				{/* Context menu */}
				{showActions && (
					<div className={`absolute bottom-full mb-1 ${fromMe ? "right-0" : "left-0"} bg-base-300 rounded-xl shadow-lg z-20 min-w-[150px] py-1 overflow-hidden`}>
						<button
							onClick={() => { onReply?.(message); setShowActions(false); }}
							className='w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-base-100 transition-colors'
						>
							<IoArrowUndo className='w-4 h-4' /> Reply
						</button>
						<button
							onClick={() => { onForward?.(message); setShowActions(false); }}
							className='w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-base-100 transition-colors'
						>
							<IoArrowRedo className='w-4 h-4' /> Forward
						</button>
						<button
							onClick={handlePin}
							className='w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-base-100 transition-colors'
						>
							<IoPin className='w-4 h-4' /> {message.isPinned ? "Unpin" : "Pin"}
						</button>
						<button
							onClick={handleStar}
							className='w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-base-100 transition-colors'
						>
							{isStarred ? <IoStar className='w-4 h-4 text-yellow-400' /> : <IoStarOutline className='w-4 h-4' />}
							{isStarred ? "Unstar" : "Star"}
						</button>
						<button
							onClick={() => handleDelete(false)}
							className='w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-base-100 transition-colors'
						>
							<IoTrash className='w-4 h-4' /> Delete for me
						</button>
						{fromMe && (
							<button
								onClick={() => handleDelete(true)}
								className='w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-base-100 transition-colors'
							>
								<IoTrash className='w-4 h-4' /> Delete for everyone
							</button>
						)}
					</div>
				)}

				{/* Reply preview */}
				{message.replyTo?.text && (
					<div className={`mx-1 mb-0.5 px-3 py-1.5 rounded-t-xl border-l-2 border-primary ${
						fromMe ? "bg-blue-800/30" : "bg-base-300/50"
					}`}>
						<p className='text-[10px] font-semibold text-primary'>{message.replyTo.senderName}</p>
						<p className='text-xs text-slate-400 truncate'>{message.replyTo.text}</p>
					</div>
				)}

				<div
					className={`rounded-2xl overflow-hidden ${shakeClass} ${
						fromMe
							? "bg-primary text-white rounded-br-md"
							: "bg-base-200 text-slate-200 rounded-bl-md"
					}`}
				>
					{isDeleted ? (
						<p className='text-sm italic text-slate-400 px-4 py-2.5'>
							🚫 This message was deleted
						</p>
					) : (
						<>
							{isGroup && !fromMe && senderName && (
								<p className='text-xs font-semibold text-primary px-4 pt-2'>
									{senderName}
								</p>
							)}
							{hasFile && <FileAttachment file={message.file} fromMe={fromMe} allImages={allImages} />}
							{hasText && (
								<p className='text-sm leading-relaxed break-words px-4 py-2.5'>
									{message.message}
								</p>
							)}
							{hasFile && !hasText && <div className='h-1' />}

							{/* Link previews */}
							{hasText && extractUrls(message.message).map((url, i) => (
								<LinkPreview key={i} url={url} fromMe={fromMe} />
							))}
						</>
					)}
				</div>

				{/* Reactions display */}
				{Object.keys(groupedReactions).length > 0 && (
					<div className={`flex flex-wrap gap-1 mt-0.5 ${fromMe ? "justify-end" : "justify-start"}`}>
						{Object.entries(groupedReactions).map(([emoji, count]) => (
							<button
								key={emoji}
								onClick={() => handleReact(emoji)}
								className='flex items-center gap-0.5 px-1.5 py-0.5 bg-base-300 rounded-full text-xs hover:bg-base-100 transition-colors'
							>
								<span>{emoji}</span>
								{count > 1 && <span className='text-slate-400'>{count}</span>}
							</button>
						))}
					</div>
				)}

				<div className={`flex items-center gap-1 mt-1 ${fromMe ? "justify-end" : "justify-start"}`}>
					{message.isPinned && <IoPin className='w-3 h-3 text-slate-500' />}
					{isStarred && <IoStar className='w-3 h-3 text-yellow-500' />}
					<span className='text-[11px] text-slate-500'>{formattedTime}</span>
					{fromMe && !isDeleted && <MessageStatus status={message.status} />}
				</div>
			</div>
		</div>
	);
};

export default Message;

// ─── File Attachment Component ──────────────────────────────────
const FileAttachment = ({ file, fromMe, allImages = [] }) => {
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const isVoiceMessage = file.type === "audio" && file.name?.startsWith("voice-message");

	if (file.type === "image") {
		return (
			<>
				<div className='cursor-pointer' onClick={() => setLightboxOpen(true)}>
					<img
						src={file.url}
						alt={file.name}
						className='max-w-full max-h-64 object-contain'
						loading='lazy'
					/>
				</div>
				<ImagePreviewModal
					isOpen={lightboxOpen}
					onClose={() => setLightboxOpen(false)}
					imageUrl={file.url}
					imageName={file.name}
					allImages={allImages}
				/>
			</>
		);
	}

	if (file.type === "video") {
		return (
			<div className='p-2'>
				<video src={file.url} controls className='max-w-full max-h-64 rounded-lg' preload='metadata' />
			</div>
		);
	}

	if (file.type === "audio") {
		return (
			<div className='px-4 py-2'>
				{isVoiceMessage && (
					<div className='flex items-center gap-1.5 mb-1'>
						<IoMic className='w-3.5 h-3.5 text-slate-400' />
						<span className={`text-xs ${fromMe ? "text-blue-200" : "text-slate-400"}`}>Voice message</span>
					</div>
				)}
				<audio src={file.url} controls className='w-full max-w-[250px]' preload='metadata' />
			</div>
		);
	}

	return (
		<div className='px-4 py-3'>
			<a href={file.url} download={file.name} target='_blank' rel='noopener noreferrer'
				className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
					fromMe ? "bg-blue-600/30 hover:bg-blue-600/40" : "bg-base-300 hover:bg-base-100"
				}`}
			>
				<div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
					fromMe ? "bg-blue-600/50" : "bg-base-100"
				}`}>
					<IoDocumentText className='w-5 h-5' />
				</div>
				<div className='flex-1 min-w-0'>
					<p className='text-sm font-medium truncate'>{file.name}</p>
					<p className={`text-xs ${fromMe ? "text-blue-200" : "text-slate-400"}`}>{formatSize(file.size)}</p>
				</div>
				<IoDownload className='w-5 h-5 flex-shrink-0 opacity-60' />
			</a>
		</div>
	);
};

function formatSize(bytes) {
	if (!bytes) return "";
	if (bytes < 1024) return bytes + " B";
	if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
	return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

const MessageStatus = ({ status }) => {
	if (status === "seen") return <span className='text-blue-400 text-xs' title='Seen'>✓✓</span>;
	if (status === "delivered") return <span className='text-slate-400 text-xs' title='Delivered'>✓✓</span>;
	return <span className='text-slate-600 text-xs' title='Sent'>✓</span>;
};
