import { useState, useEffect, useCallback } from "react";
import { IoClose, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { getProfilePic } from "../../utils/avatar";

const StoryViewer = ({ storyGroup, onClose }) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [progress, setProgress] = useState(0);

	const stories = storyGroup.stories || [];
	const currentStory = stories[currentIndex];
	const user = storyGroup.user;

	const goNext = useCallback(() => {
		if (currentIndex < stories.length - 1) {
			setCurrentIndex((prev) => prev + 1);
			setProgress(0);
		} else {
			onClose();
		}
	}, [currentIndex, stories.length, onClose]);

	const goPrev = useCallback(() => {
		if (currentIndex > 0) {
			setCurrentIndex((prev) => prev - 1);
			setProgress(0);
		}
	}, [currentIndex]);

	// Auto-advance timer
	useEffect(() => {
		const duration = 5000; // 5 seconds per story
		const interval = 50;
		const increment = (interval / duration) * 100;

		const timer = setInterval(() => {
			setProgress((prev) => {
				if (prev >= 100) {
					goNext();
					return 0;
				}
				return prev + increment;
			});
		}, interval);

		return () => clearInterval(timer);
	}, [currentIndex, goNext]);

	// Mark as viewed
	useEffect(() => {
		if (currentStory?._id) {
			fetch(`/api/stories/${currentStory._id}/view`, { method: "POST" }).catch(() => {});
		}
	}, [currentStory?._id]);

	// Keyboard navigation
	useEffect(() => {
		const handleKey = (e) => {
			if (e.key === "ArrowRight") goNext();
			if (e.key === "ArrowLeft") goPrev();
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [goNext, goPrev, onClose]);

	if (!currentStory) return null;

	const timeAgo = getTimeAgo(currentStory.createdAt);

	return (
		<div className='fixed inset-0 z-[100] bg-black flex items-center justify-center'>
			{/* Progress bars */}
			<div className='absolute top-0 left-0 right-0 flex gap-1 p-2 z-10'>
				{stories.map((_, idx) => (
					<div key={idx} className='flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden'>
						<div
							className='h-full bg-white rounded-full transition-all duration-100'
							style={{
								width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%',
							}}
						/>
					</div>
				))}
			</div>

			{/* Header */}
			<div className='absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-10'>
				<div className='flex items-center gap-2'>
					<div className='w-8 h-8 rounded-full overflow-hidden'>
						<img src={getProfilePic(user)} alt={user.fullName} className='w-full h-full object-cover' />
					</div>
					<div>
						<p className='text-white text-sm font-medium'>{user.fullName}</p>
						<p className='text-white/60 text-xs'>{timeAgo}</p>
					</div>
				</div>
				<button onClick={onClose} className='p-2 text-white/80 hover:text-white'>
					<IoClose className='w-6 h-6' />
				</button>
			</div>

			{/* Story content */}
			<div className='w-full max-w-lg h-full flex items-center justify-center relative'>
				{currentStory.type === "text" ? (
					<div
						className='w-full h-full flex items-center justify-center p-8'
						style={{ backgroundColor: currentStory.color || "#3B82F6" }}
					>
						<p className='text-white text-2xl font-semibold text-center break-words max-w-md leading-relaxed'>
							{currentStory.content}
						</p>
					</div>
				) : (
					<img
						src={currentStory.content}
						alt='Story'
						className='max-w-full max-h-full object-contain'
					/>
				)}

				{/* Navigation areas */}
				<button
					onClick={goPrev}
					className='absolute left-0 top-0 w-1/3 h-full flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity'
				>
					<IoChevronBack className='w-8 h-8 text-white/60' />
				</button>
				<button
					onClick={goNext}
					className='absolute right-0 top-0 w-1/3 h-full flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity'
				>
					<IoChevronForward className='w-8 h-8 text-white/60' />
				</button>
			</div>
		</div>
	);
};

function getTimeAgo(dateString) {
	const diff = Date.now() - new Date(dateString).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "Just now";
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	return "1d ago";
}

export default StoryViewer;
