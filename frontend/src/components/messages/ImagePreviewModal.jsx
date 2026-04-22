import { useState, useEffect, useCallback } from "react";
import { IoClose, IoDownload, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { HiZoomIn, HiZoomOut } from "react-icons/hi";

const ImagePreviewModal = ({ isOpen, onClose, imageUrl, imageName, allImages = [] }) => {
	const [scale, setScale] = useState(1);
	const [currentIndex, setCurrentIndex] = useState(0);

	// Find current image index in allImages
	useEffect(() => {
		if (isOpen && allImages.length > 0) {
			const idx = allImages.findIndex((img) => img.url === imageUrl);
			if (idx !== -1) setCurrentIndex(idx);
			setScale(1);
		}
	}, [isOpen, imageUrl, allImages]);

	const currentImage = allImages.length > 0 ? allImages[currentIndex] : { url: imageUrl, name: imageName };

	const zoomIn = () => setScale((s) => Math.min(s + 0.5, 4));
	const zoomOut = () => setScale((s) => Math.max(s - 0.5, 0.5));
	const resetZoom = () => setScale(1);

	const goNext = useCallback(() => {
		if (currentIndex < allImages.length - 1) {
			setCurrentIndex((i) => i + 1);
			setScale(1);
		}
	}, [currentIndex, allImages.length]);

	const goPrev = useCallback(() => {
		if (currentIndex > 0) {
			setCurrentIndex((i) => i - 1);
			setScale(1);
		}
	}, [currentIndex]);

	const handleDownload = () => {
		const a = document.createElement("a");
		a.href = currentImage.url;
		a.download = currentImage.name || "image";
		a.target = "_blank";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	// Keyboard controls
	useEffect(() => {
		if (!isOpen) return;
		const handleKey = (e) => {
			if (e.key === "Escape") onClose();
			if (e.key === "ArrowRight") goNext();
			if (e.key === "ArrowLeft") goPrev();
			if (e.key === "+" || e.key === "=") zoomIn();
			if (e.key === "-") zoomOut();
			if (e.key === "0") resetZoom();
		};
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [isOpen, onClose, goNext, goPrev]);

	// Scroll wheel zoom
	const handleWheel = (e) => {
		e.preventDefault();
		if (e.deltaY < 0) zoomIn();
		else zoomOut();
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-50 bg-black/95 flex flex-col' onClick={onClose}>
			{/* Top toolbar */}
			<div
				className='flex items-center justify-between px-4 py-3 bg-black/50'
				onClick={(e) => e.stopPropagation()}
			>
				<div className='flex items-center gap-2'>
					{allImages.length > 1 && (
						<span className='text-sm text-slate-400'>
							{currentIndex + 1} of {allImages.length}
						</span>
					)}
					<span className='text-sm text-slate-300 truncate max-w-[200px]'>
						{currentImage.name}
					</span>
				</div>

				<div className='flex items-center gap-1'>
					<button
						onClick={zoomOut}
						className='p-2 hover:bg-white/10 rounded-lg text-white transition-colors'
						title='Zoom out'
					>
						<HiZoomOut className='w-5 h-5' />
					</button>
					<span className='text-xs text-slate-400 w-12 text-center'>
						{Math.round(scale * 100)}%
					</span>
					<button
						onClick={zoomIn}
						className='p-2 hover:bg-white/10 rounded-lg text-white transition-colors'
						title='Zoom in'
					>
						<HiZoomIn className='w-5 h-5' />
					</button>
					<button
						onClick={handleDownload}
						className='p-2 hover:bg-white/10 rounded-lg text-white transition-colors ml-2'
						title='Download'
					>
						<IoDownload className='w-5 h-5' />
					</button>
					<button
						onClick={onClose}
						className='p-2 hover:bg-white/10 rounded-lg text-white transition-colors ml-2'
						title='Close'
					>
						<IoClose className='w-6 h-6' />
					</button>
				</div>
			</div>

			{/* Image */}
			<div
				className='flex-1 flex items-center justify-center overflow-hidden relative'
				onClick={(e) => e.stopPropagation()}
				onWheel={handleWheel}
			>
				{/* Prev arrow */}
				{allImages.length > 1 && currentIndex > 0 && (
					<button
						onClick={goPrev}
						className='absolute left-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10'
					>
						<IoChevronBack className='w-6 h-6' />
					</button>
				)}

				<img
					src={currentImage.url}
					alt={currentImage.name}
					className='max-w-full max-h-full object-contain transition-transform duration-200 select-none'
					style={{ transform: `scale(${scale})` }}
					draggable={false}
				/>

				{/* Next arrow */}
				{allImages.length > 1 && currentIndex < allImages.length - 1 && (
					<button
						onClick={goNext}
						className='absolute right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10'
					>
						<IoChevronForward className='w-6 h-6' />
					</button>
				)}
			</div>
		</div>
	);
};

export default ImagePreviewModal;
