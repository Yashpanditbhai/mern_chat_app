import { useState, useRef, useEffect } from "react";
import { IoClose, IoCamera, IoCameraReverse } from "react-icons/io5";

const CameraCapture = ({ isOpen, onClose, onCapture }) => {
	const videoRef = useRef(null);
	const streamRef = useRef(null);
	const [facingMode, setFacingMode] = useState("user");
	const [captured, setCaptured] = useState(null);

	useEffect(() => {
		if (isOpen) {
			startCamera();
		}
		return () => stopCamera();
	}, [isOpen, facingMode]);

	const startCamera = async () => {
		try {
			stopCamera();
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
			});
			streamRef.current = stream;
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
			}
		} catch (error) {
			console.error("Camera error:", error);
		}
	};

	const stopCamera = () => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((t) => t.stop());
			streamRef.current = null;
		}
	};

	const capture = () => {
		const video = videoRef.current;
		if (!video) return;

		const canvas = document.createElement("canvas");
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const ctx = canvas.getContext("2d");
		ctx.drawImage(video, 0, 0);

		canvas.toBlob((blob) => {
			if (blob) {
				const url = URL.createObjectURL(blob);
				setCaptured({ blob, url });
			}
		}, "image/jpeg", 0.9);
	};

	const handleSend = () => {
		if (captured) {
			const file = new File([captured.blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
			onCapture(file);
			URL.revokeObjectURL(captured.url);
			setCaptured(null);
			stopCamera();
			onClose();
		}
	};

	const handleRetake = () => {
		if (captured) URL.revokeObjectURL(captured.url);
		setCaptured(null);
	};

	const handleClose = () => {
		if (captured) URL.revokeObjectURL(captured.url);
		setCaptured(null);
		stopCamera();
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-50 bg-black flex flex-col'>
			{/* Top bar */}
			<div className='flex items-center justify-between px-4 py-3'>
				<button onClick={handleClose} className='p-2 text-white hover:bg-white/10 rounded-full'>
					<IoClose className='w-6 h-6' />
				</button>
				{!captured && (
					<button
						onClick={() => setFacingMode((m) => m === "user" ? "environment" : "user")}
						className='p-2 text-white hover:bg-white/10 rounded-full'
					>
						<IoCameraReverse className='w-6 h-6' />
					</button>
				)}
			</div>

			{/* Viewfinder */}
			<div className='flex-1 flex items-center justify-center'>
				{captured ? (
					<img src={captured.url} alt='captured' className='max-w-full max-h-full object-contain' />
				) : (
					<video
						ref={videoRef}
						autoPlay
						playsInline
						muted
						className='max-w-full max-h-full object-contain'
						style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
					/>
				)}
			</div>

			{/* Bottom controls */}
			<div className='flex items-center justify-center gap-8 py-6'>
				{captured ? (
					<>
						<button
							onClick={handleRetake}
							className='px-6 py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors'
						>
							Retake
						</button>
						<button
							onClick={handleSend}
							className='px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-blue-600 transition-colors'
						>
							Send Photo
						</button>
					</>
				) : (
					<button
						onClick={capture}
						className='w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/10 transition-colors'
					>
						<IoCamera className='w-8 h-8 text-white' />
					</button>
				)}
			</div>
		</div>
	);
};

export default CameraCapture;
