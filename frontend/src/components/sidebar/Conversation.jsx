import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";
import { getProfilePic } from "../../utils/avatar";

const Conversation = ({ conversation }) => {
	const { selectedConversation, setSelectedConversation, unreadCounts, clearUnreadCount, typingUsers } =
		useConversation();

	const isSelected = selectedConversation?._id === conversation._id;
	const { onlineUsers } = useSocketContext();
	const isOnline = onlineUsers.includes(conversation._id);
	const unreadCount = unreadCounts[conversation._id] || 0;
	const isTyping = typingUsers[conversation._id];

	const handleClick = () => {
		setSelectedConversation(conversation);
		clearUnreadCount(conversation._id);
	};

	const lastMessagePreview = conversation.lastMessage?.text
		? conversation.lastMessage.text.length > 35
			? conversation.lastMessage.text.substring(0, 35) + "..."
			: conversation.lastMessage.text
		: "Start a conversation";

	return (
		<div
			className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
				isSelected
					? "bg-primary/10 border-l-2 border-primary"
					: "hover:bg-base-300 border-l-2 border-transparent"
			}`}
			onClick={handleClick}
		>
			{/* Avatar with online indicator */}
			<div className='relative flex-shrink-0'>
				<div className='w-12 h-12 rounded-full overflow-hidden'>
					<img
						src={getProfilePic(conversation)}
						alt={conversation.fullName}
						className='w-full h-full object-cover'
					/>
				</div>
				{isOnline && (
					<span className='absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-base-200 rounded-full' />
				)}
			</div>

			{/* Info */}
			<div className='flex-1 min-w-0'>
				<div className='flex justify-between items-center'>
					<h3 className={`text-sm font-semibold truncate ${isSelected ? "text-primary" : "text-white"}`}>
						{conversation.fullName}
					</h3>
					{conversation.lastMessage?.createdAt && (
						<span className='text-[11px] text-slate-500 flex-shrink-0 ml-2'>
							{formatTime(conversation.lastMessage.createdAt)}
						</span>
					)}
				</div>
				<div className='flex justify-between items-center mt-0.5'>
					<p className='text-xs truncate text-slate-400'>
						{isTyping ? (
							<span className='text-green-400 font-medium'>typing...</span>
						) : (
							lastMessagePreview
						)}
					</p>
					{unreadCount > 0 && (
						<span className='ml-2 flex-shrink-0 bg-primary text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5'>
							{unreadCount > 99 ? "99+" : unreadCount}
						</span>
					)}
				</div>
			</div>
		</div>
	);
};

export default Conversation;

function formatTime(dateString) {
	const date = new Date(dateString);
	const now = new Date();
	const diff = now - date;
	const oneDay = 86400000;

	if (diff < oneDay && date.getDate() === now.getDate()) {
		return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	}
	if (diff < 2 * oneDay) return "Yesterday";
	return date.toLocaleDateString([], { month: "short", day: "numeric" });
}
