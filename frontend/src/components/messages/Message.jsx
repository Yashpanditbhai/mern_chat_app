import { useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { extractTime } from "../../utils/extractTime";
import useConversation from "../../zustand/useConversation";
import { getProfilePic } from "../../utils/avatar";
import { IoDocumentText, IoDownload, IoClose } from "react-icons/io5";

const Message = ({ message }) => {
	const { authUser } = useAuthContext();
	const { selectedConversation } = useConversation();
	const fromMe = message.senderId === authUser._id;
	const formattedTime = extractTime(message.createdAt);
	const profilePic = fromMe ? getProfilePic(authUser) : getProfilePic(selectedConversation);
	const shakeClass = message.shouldShake ? "shake" : "";
	const hasFile = message.file?.url;
	const hasText = message.message && message.message.trim().length > 0;

	return (
		<div className={`flex items-end gap-2 mb-2 ${fromMe ? "flex-row-reverse" : ""}`}>
			{/* Avatar */}
			<div className='w-8 h-8 rounded-full overflow-hidden flex-shrink-0'>
				<img src={profilePic} alt='avatar' className='w-full h-full object-cover' />
			</div>

			{/* Bubble */}
			<div className={`max-w-[70%] ${fromMe ? "items-end" : "items-start"}`}>
				<div
					className={`rounded-2xl overflow-hidden ${shakeClass} ${
						fromMe
							? "bg-primary text-white rounded-br-md"
							: "bg-base-200 text-slate-200 rounded-bl-md"
					}`}
				>
					{/* File attachment */}
					{hasFile && <FileAttachment file={message.file} fromMe={fromMe} />}

					{/* Text */}
					{hasText && (
						<p className='text-sm leading-relaxed break-words px-4 py-2.5'>
							{message.message}
						</p>
					)}

					{/* If only file, no text, add small padding at bottom */}
					{hasFile && !hasText && <div className='h-1' />}
				</div>

				<div className={`flex items-center gap-1 mt-1 ${fromMe ? "justify-end" : "justify-start"}`}>
					<span className='text-[11px] text-slate-500'>{formattedTime}</span>
					{fromMe && <MessageStatus status={message.status} />}
				</div>
			</div>
		</div>
	);
};

export default Message;

// ─── File Attachment Component ──────────────────────────────────
const FileAttachment = ({ file, fromMe }) => {
	const [lightboxOpen, setLightboxOpen] = useState(false);

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

				{/* Lightbox */}
				{lightboxOpen && (
					<div
						className='fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4'
						onClick={() => setLightboxOpen(false)}
					>
						<button
							onClick={() => setLightboxOpen(false)}
							className='absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors'
						>
							<IoClose className='w-6 h-6' />
						</button>
						<img
							src={file.url}
							alt={file.name}
							className='max-w-full max-h-[90vh] object-contain rounded-lg'
							onClick={(e) => e.stopPropagation()}
						/>
					</div>
				)}
			</>
		);
	}

	if (file.type === "video") {
		return (
			<div className='p-2'>
				<video
					src={file.url}
					controls
					className='max-w-full max-h-64 rounded-lg'
					preload='metadata'
				/>
			</div>
		);
	}

	if (file.type === "audio") {
		return (
			<div className='px-4 py-2'>
				<audio src={file.url} controls className='w-full max-w-[250px]' preload='metadata' />
			</div>
		);
	}

	// Document / generic file
	return (
		<div className='px-4 py-3'>
			<a
				href={file.url}
				download={file.name}
				target='_blank'
				rel='noopener noreferrer'
				className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
					fromMe
						? "bg-blue-600/30 hover:bg-blue-600/40"
						: "bg-base-300 hover:bg-base-100"
				}`}
			>
				<div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
					fromMe ? "bg-blue-600/50" : "bg-base-100"
				}`}>
					<IoDocumentText className='w-5 h-5' />
				</div>
				<div className='flex-1 min-w-0'>
					<p className='text-sm font-medium truncate'>{file.name}</p>
					<p className={`text-xs ${fromMe ? "text-blue-200" : "text-slate-400"}`}>
						{formatSize(file.size)}
					</p>
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

// ─── Message Status (ticks) ─────────────────────────────────────
const MessageStatus = ({ status }) => {
	if (status === "seen") {
		return <span className='text-blue-400 text-xs' title='Seen'>&#10003;&#10003;</span>;
	}
	if (status === "delivered") {
		return <span className='text-slate-400 text-xs' title='Delivered'>&#10003;&#10003;</span>;
	}
	return <span className='text-slate-600 text-xs' title='Sent'>&#10003;</span>;
};
