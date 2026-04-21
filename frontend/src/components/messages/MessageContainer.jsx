import { useEffect } from "react";
import useConversation from "../../zustand/useConversation";
import MessageInput from "./MessageInput";
import Messages from "./Messages";
import { BsChatDotsFill } from "react-icons/bs";
import { useAuthContext } from "../../context/AuthContext";
import { useSocketContext } from "../../context/SocketContext";
import { getProfilePic } from "../../utils/avatar";

const MessageContainer = () => {
	const { selectedConversation, setSelectedConversation, clearUnreadCount, typingUsers } =
		useConversation();
	const { socket, onlineUsers } = useSocketContext();

	const isOnline = selectedConversation
		? onlineUsers.includes(selectedConversation._id)
		: false;
	const isTyping = selectedConversation
		? typingUsers[selectedConversation._id]
		: false;

	useEffect(() => {
		if (selectedConversation?._id && socket) {
			clearUnreadCount(selectedConversation._id);
			socket.emit("messagesSeen", { senderId: selectedConversation._id });
		}
	}, [selectedConversation?._id, socket, clearUnreadCount]);

	useEffect(() => {
		return () => setSelectedConversation(null);
	}, [setSelectedConversation]);

	return (
		<div className='flex-1 flex flex-col h-full bg-base-100'>
			{!selectedConversation ? (
				<NoChatSelected />
			) : (
				<>
					{/* Chat Header */}
					<div className='px-5 py-3 bg-base-200 border-b border-base-300 flex items-center gap-3'>
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
							<h3 className='font-semibold text-white text-sm'>
								{selectedConversation.fullName}
							</h3>
							<p className='text-xs'>
								{isTyping ? (
									<span className='text-green-400 font-medium'>typing...</span>
								) : isOnline ? (
									<span className='text-green-400'>Online</span>
								) : (
									<span className='text-slate-500'>Offline</span>
								)}
							</p>
						</div>
					</div>

					{/* Messages */}
					<Messages />

					{/* Input */}
					<MessageInput />
				</>
			)}
		</div>
	);
};

export default MessageContainer;

const NoChatSelected = () => {
	const { authUser } = useAuthContext();
	return (
		<div className='flex-1 flex items-center justify-center'>
			<div className='text-center'>
				<div className='inline-flex items-center justify-center w-20 h-20 rounded-full bg-base-200 mb-4'>
					<BsChatDotsFill className='w-10 h-10 text-slate-600' />
				</div>
				<h2 className='text-xl font-semibold text-white mb-2'>
					Welcome, {authUser?.fullName}
				</h2>
				<p className='text-slate-500 text-sm max-w-xs'>
					Select a conversation from the sidebar to start chatting
				</p>
			</div>
		</div>
	);
};
