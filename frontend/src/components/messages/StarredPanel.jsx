import { useState, useEffect } from "react";
import { IoClose, IoStar } from "react-icons/io5";
import { getProfilePic } from "../../utils/avatar";
import { extractTime } from "../../utils/extractTime";

const StarredPanel = ({ isOpen, onClose }) => {
	const [messages, setMessages] = useState([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!isOpen) return;
		const fetch_ = async () => {
			setLoading(true);
			try {
				const res = await fetch("/api/messages/starred/all");
				const data = await res.json();
				if (Array.isArray(data)) setMessages(data);
			} catch (error) {
				console.error("Failed to fetch starred:", error);
			} finally {
				setLoading(false);
			}
		};
		fetch_();
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4' onClick={onClose}>
			<div
				className='bg-base-200 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col'
				onClick={(e) => e.stopPropagation()}
			>
				<div className='flex items-center justify-between p-4 border-b border-base-300'>
					<div className='flex items-center gap-2'>
						<IoStar className='w-5 h-5 text-yellow-400' />
						<h3 className='text-lg font-semibold text-white'>Starred Messages</h3>
					</div>
					<button onClick={onClose} className='p-1.5 hover:bg-base-300 rounded-full'>
						<IoClose className='w-5 h-5 text-slate-400' />
					</button>
				</div>

				<div className='flex-1 overflow-y-auto px-4 pb-4'>
					{loading && (
						<div className='flex justify-center py-8'>
							<span className='loading loading-spinner loading-md text-primary'></span>
						</div>
					)}

					{!loading && messages.length === 0 && (
						<p className='text-sm text-slate-500 text-center py-8'>No starred messages</p>
					)}

					{!loading && messages.map((msg) => {
						const sender = msg.senderId;
						return (
							<div key={msg._id} className='py-3 border-b border-base-300 last:border-0'>
								<div className='flex items-center gap-2 mb-1'>
									{sender && typeof sender === "object" && (
										<div className='w-6 h-6 rounded-full overflow-hidden'>
											<img src={getProfilePic(sender)} alt='' className='w-full h-full object-cover' />
										</div>
									)}
									<span className='text-xs font-semibold text-white'>
										{sender?.fullName || "Unknown"}
									</span>
									<span className='text-[10px] text-slate-500'>
										{extractTime(msg.createdAt)}
									</span>
								</div>
								{msg.message && (
									<p className='text-sm text-slate-300 pl-8'>{msg.message}</p>
								)}
								{msg.file?.url && (
									<p className='text-sm text-slate-400 pl-8'>
										📎 {msg.file.name}
									</p>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default StarredPanel;
