import { useEffect, useRef } from "react";
import { useCallContext } from "../../context/CallContext";
import { useLanguage } from "../../context/LanguageContext";
import { getProfilePic } from "../../utils/avatar";
import {
	IoCall,
	IoCallOutline,
	IoClose,
	IoMic,
	IoMicOff,
	IoVideocam,
	IoVideocamOff,
	IoDesktop,
	IoDesktopOutline,
} from "react-icons/io5";

const CallModal = () => {
	const {
		callState,
		callType,
		remoteUser,
		localStream,
		remoteStream,
		isMuted,
		isCameraOff,
		isScreenSharing,
		callDuration,
		answerCall,
		rejectCall,
		endCall,
		toggleMute,
		toggleCamera,
		toggleScreenShare,
	} = useCallContext();

	const { t } = useLanguage();
	const localVideoRef = useRef(null);
	const remoteVideoRef = useRef(null);

	useEffect(() => {
		if (localVideoRef.current && localStream) {
			localVideoRef.current.srcObject = localStream;
		}
	}, [localStream]);

	useEffect(() => {
		if (remoteVideoRef.current && remoteStream) {
			remoteVideoRef.current.srcObject = remoteStream;
		}
	}, [remoteStream]);

	if (callState === "idle" || !remoteUser) return null;

	const formatDuration = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	const isVideo = callType === "video";

	return (
		<div className='fixed inset-0 z-[100] bg-black/90 flex items-center justify-center'>
			<div className='relative w-full h-full max-w-4xl max-h-[90vh] flex flex-col items-center justify-center'>
				{/* Remote Video (large) or avatar */}
				{callState === "inCall" && isVideo && remoteStream ? (
					<video
						ref={remoteVideoRef}
						autoPlay
						playsInline
						className='w-full h-full object-cover rounded-2xl'
					/>
				) : (
					<div className='flex flex-col items-center gap-4'>
						<div className='w-28 h-28 rounded-full overflow-hidden border-4 border-primary/50'>
							<img
								src={getProfilePic(remoteUser)}
								alt={remoteUser.fullName}
								className='w-full h-full object-cover'
							/>
						</div>
						<h2 className='text-2xl font-bold text-white'>{remoteUser.fullName}</h2>
						{callState === "calling" && (
							<p className='text-slate-400 animate-pulse'>{t("calling")}...</p>
						)}
						{callState === "ringing" && (
							<p className='text-green-400 animate-pulse'>{remoteUser.fullName} {t("incomingCall")}</p>
						)}
						{callState === "inCall" && (
							<p className='text-slate-400'>{formatDuration(callDuration)}</p>
						)}
					</div>
				)}

				{/* Screen sharing indicator */}
				{isScreenSharing && callState === "inCall" && (
					<div className='absolute top-4 left-1/2 -translate-x-1/2 bg-green-600/90 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2'>
						<IoDesktop className='w-4 h-4' />
						{t("screenSharing")}
					</div>
				)}

				{/* Local Video (small, picture-in-picture) */}
				{callState === "inCall" && isVideo && localStream && (
					<div className='absolute top-4 right-4 w-40 h-28 rounded-xl overflow-hidden border-2 border-slate-600 shadow-lg'>
						<video
							ref={localVideoRef}
							autoPlay
							playsInline
							muted
							className='w-full h-full object-cover mirror'
							style={{ transform: "scaleX(-1)" }}
						/>
					</div>
				)}

				{/* Call duration during video call */}
				{callState === "inCall" && isVideo && (
					<div className='absolute top-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm'>
						{formatDuration(callDuration)}
					</div>
				)}

				{/* Controls */}
				<div className='absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4'>
					{callState === "ringing" ? (
						<>
							{/* Reject */}
							<button
								onClick={rejectCall}
								className='w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-colors'
								title={t("reject")}
							>
								<IoClose className='w-7 h-7' />
							</button>
							{/* Accept */}
							<button
								onClick={answerCall}
								className='w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center text-white transition-colors animate-pulse'
								title={t("accept")}
							>
								<IoCall className='w-7 h-7' />
							</button>
						</>
					) : callState === "calling" ? (
						<button
							onClick={endCall}
							className='w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-colors'
							title={t("cancel")}
						>
							<IoCallOutline className='w-7 h-7 rotate-[135deg]' />
						</button>
					) : (
						<>
							{/* Mute */}
							<button
								onClick={toggleMute}
								className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${
									isMuted ? "bg-red-600 hover:bg-red-700" : "bg-slate-700 hover:bg-slate-600"
								}`}
								title={isMuted ? t("unmuteMic") : t("muteMic")}
							>
								{isMuted ? <IoMicOff className='w-5 h-5' /> : <IoMic className='w-5 h-5' />}
							</button>

							{/* Camera toggle (video calls) */}
							{isVideo && (
								<button
									onClick={toggleCamera}
									className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${
										isCameraOff ? "bg-red-600 hover:bg-red-700" : "bg-slate-700 hover:bg-slate-600"
									}`}
									title={isCameraOff ? t("cameraOn") : t("cameraOff")}
								>
									{isCameraOff ? <IoVideocamOff className='w-5 h-5' /> : <IoVideocam className='w-5 h-5' />}
								</button>
							)}

							{/* Screen share (video calls) */}
							{isVideo && (
								<button
									onClick={toggleScreenShare}
									className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${
										isScreenSharing ? "bg-green-600 hover:bg-green-700" : "bg-slate-700 hover:bg-slate-600"
									}`}
									title={isScreenSharing ? t("stopSharing") : t("shareScreen")}
								>
									{isScreenSharing ? <IoDesktop className='w-5 h-5' /> : <IoDesktopOutline className='w-5 h-5' />}
								</button>
							)}

							{/* End call */}
							<button
								onClick={endCall}
								className='w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-colors'
								title={t("endCall")}
							>
								<IoCallOutline className='w-7 h-7 rotate-[135deg]' />
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default CallModal;
