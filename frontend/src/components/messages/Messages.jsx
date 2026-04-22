import { useEffect, useRef } from "react";
import useGetMessages from "../../hooks/useGetMessages";
import MessageSkeleton from "../skeletons/MessageSkeleton";
import Message from "./Message";
import useListenMessages from "../../hooks/useListenMessages";
import { useTheme } from "../../context/ThemeContext";
import { getWallpaperStyle } from "../sidebar/SettingsModal";

const Messages = ({ onReply, onForward }) => {
	const { messages, loading } = useGetMessages();
	useListenMessages();
	const lastMessageRef = useRef();
	const { chatWallpaper } = useTheme();

	useEffect(() => {
		setTimeout(() => {
			lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
		}, 100);
	}, [messages]);

	const wallpaperStyle = chatWallpaper ? getWallpaperStyle(chatWallpaper) : {};

	return (
		<div className='flex-1 overflow-y-auto px-4 py-3 space-y-1' style={wallpaperStyle}>
			{loading && [...Array(4)].map((_, idx) => <MessageSkeleton key={idx} />)}

			{!loading && messages.length === 0 && (
				<div className='flex items-center justify-center h-full'>
					<p className='text-slate-500 text-sm'>
						No messages yet. Send one to start the conversation.
					</p>
				</div>
			)}

			{!loading &&
				messages.length > 0 &&
				messages.map((message) => (
					<div key={message._id} ref={lastMessageRef}>
						<Message message={message} onReply={onReply} onForward={onForward} />
					</div>
				))}
		</div>
	);
};

export default Messages;
