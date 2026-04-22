import { useState, useEffect } from "react";
import { IoClose, IoTime, IoTrash } from "react-icons/io5";
import { useLanguage } from "../../context/LanguageContext";
import toast from "react-hot-toast";

const ScheduledMessagesPanel = ({ isOpen, onClose }) => {
	const { t } = useLanguage();
	const [messages, setMessages] = useState([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!isOpen) return;
		const fetchScheduled = async () => {
			setLoading(true);
			try {
				const res = await fetch("/api/messages/scheduled");
				const data = await res.json();
				if (Array.isArray(data)) setMessages(data);
			} catch (error) {
				console.error("Failed to fetch scheduled messages:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchScheduled();
	}, [isOpen]);

	const handleCancel = async (id) => {
		try {
			const res = await fetch(`/api/messages/scheduled/${id}`, { method: "DELETE" });
			if (!res.ok) throw new Error("Failed to cancel");
			setMessages((prev) => prev.filter((m) => m._id !== id));
			toast.success(t("scheduleCancelled"));
		} catch (error) {
			toast.error(error.message);
		}
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4' onClick={onClose}>
			<div
				className='bg-base-200 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col'
				onClick={(e) => e.stopPropagation()}
			>
				<div className='flex items-center justify-between p-4 border-b border-base-300'>
					<div className='flex items-center gap-2'>
						<IoTime className='w-5 h-5 text-primary' />
						<h3 className='text-lg font-semibold text-white'>{t("scheduledMessages")}</h3>
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
						<p className='text-sm text-slate-500 text-center py-8'>{t("noScheduledMessages")}</p>
					)}

					{!loading && messages.map((msg) => (
						<div key={msg._id} className='py-3 border-b border-base-300 last:border-0'>
							<div className='flex items-start justify-between gap-2'>
								<div className='flex-1 min-w-0'>
									<p className='text-xs text-slate-400 mb-1'>
										{t("to")}: {msg.receiverId?.fullName || "Unknown"}
									</p>
									<p className='text-sm text-slate-200 break-words'>{msg.message}</p>
									<p className='text-xs text-primary mt-1'>
										{new Date(msg.scheduledAt).toLocaleString()}
									</p>
								</div>
								<button
									onClick={() => handleCancel(msg._id)}
									className='p-2 text-red-400 hover:text-red-300 hover:bg-base-300 rounded-lg transition-colors flex-shrink-0'
									title={t("cancel")}
								>
									<IoTrash className='w-4 h-4' />
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default ScheduledMessagesPanel;
