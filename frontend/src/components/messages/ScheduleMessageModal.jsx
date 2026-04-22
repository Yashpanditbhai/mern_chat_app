import { useState } from "react";
import { IoClose, IoTime } from "react-icons/io5";
import { useLanguage } from "../../context/LanguageContext";
import toast from "react-hot-toast";

const ScheduleMessageModal = ({ isOpen, onClose, onSchedule }) => {
	const { t } = useLanguage();
	const [dateTime, setDateTime] = useState("");

	if (!isOpen) return null;

	const getMinDateTime = () => {
		const now = new Date();
		now.setMinutes(now.getMinutes() + 1);
		return now.toISOString().slice(0, 16);
	};

	const handleSchedule = () => {
		if (!dateTime) {
			toast.error("Please select a date and time");
			return;
		}
		const scheduled = new Date(dateTime);
		if (scheduled <= new Date()) {
			toast.error("Please select a future time");
			return;
		}
		onSchedule(scheduled.toISOString());
		setDateTime("");
		onClose();
	};

	return (
		<div className='fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4' onClick={onClose}>
			<div
				className='bg-base-200 rounded-2xl w-full max-w-xs p-5 relative'
				onClick={(e) => e.stopPropagation()}
			>
				<button
					onClick={onClose}
					className='absolute top-3 right-3 p-1.5 hover:bg-base-300 rounded-full transition-colors'
				>
					<IoClose className='w-5 h-5 text-slate-400' />
				</button>

				<div className='flex items-center gap-2 mb-4'>
					<IoTime className='w-5 h-5 text-primary' />
					<h3 className='text-base font-semibold text-white'>{t("scheduleMessage")}</h3>
				</div>

				<p className='text-xs text-slate-400 mb-3'>{t("scheduleDesc")}</p>

				<input
					type='datetime-local'
					value={dateTime}
					onChange={(e) => setDateTime(e.target.value)}
					min={getMinDateTime()}
					className='w-full px-3 py-2.5 rounded-xl bg-base-300 border border-slate-700 text-sm text-white focus:outline-none focus:border-primary transition-colors mb-4'
				/>

				<button
					onClick={handleSchedule}
					className='w-full py-2.5 bg-primary hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors'
				>
					{t("schedule")}
				</button>
			</div>
		</div>
	);
};

export default ScheduleMessageModal;
