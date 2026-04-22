import useConversation from "../../zustand/useConversation";
import { IoPeople } from "react-icons/io5";

const GroupConversation = ({ group }) => {
	const { selectedConversation, setSelectedConversation } = useConversation();
	const isSelected = selectedConversation?._id === group._id;

	const handleClick = () => {
		setSelectedConversation({
			...group,
			isGroupChat: true,
		});
	};

	const lastMessagePreview = group.lastMessage?.text
		? `${group.lastMessage.senderName ? group.lastMessage.senderName.split(" ")[0] + ": " : ""}${
				group.lastMessage.text.length > 30
					? group.lastMessage.text.substring(0, 30) + "..."
					: group.lastMessage.text
		  }`
		: "No messages yet";

	return (
		<div
			className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
				isSelected
					? "bg-primary/10 border-l-2 border-primary"
					: "hover:bg-base-300 border-l-2 border-transparent"
			}`}
			onClick={handleClick}
		>
			{/* Group icon */}
			<div className='w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0'>
				<IoPeople className='w-6 h-6 text-primary' />
			</div>

			{/* Info */}
			<div className='flex-1 min-w-0'>
				<div className='flex justify-between items-center'>
					<h3 className={`text-sm font-semibold truncate ${isSelected ? "text-primary" : "text-white"}`}>
						{group.groupName}
					</h3>
					{group.lastMessage?.createdAt && (
						<span className='text-[11px] text-slate-500 flex-shrink-0 ml-2'>
							{formatTime(group.lastMessage.createdAt)}
						</span>
					)}
				</div>
				<div className='flex justify-between items-center mt-0.5'>
					<p className='text-xs truncate text-slate-400'>{lastMessagePreview}</p>
					<span className='text-[10px] text-slate-500 flex-shrink-0 ml-2'>
						{group.participants?.length || 0} members
					</span>
				</div>
			</div>
		</div>
	);
};

export default GroupConversation;

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
