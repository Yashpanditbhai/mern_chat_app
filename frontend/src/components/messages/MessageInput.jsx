import { useState, useRef, useEffect } from "react";
import { BsSend } from "react-icons/bs";
import { BsEmojiSmile } from "react-icons/bs";
import { IoAttach, IoClose, IoImage, IoMic, IoCamera, IoBarChart } from "react-icons/io5";
import { HiGif } from "react-icons/hi2";
import { IoBrush } from "react-icons/io5";
import EmojiPicker from "emoji-picker-react";
import GifPicker from "./GifPicker";
import CameraCapture from "./CameraCapture";
import ImageEditor from "./ImageEditor";
import useSendMessage from "../../hooks/useSendMessage";
import useConversation from "../../zustand/useConversation";
import useTypingIndicator from "../../hooks/useTypingIndicator";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const MessageInput = ({ replyingTo, onCancelReply, onCreatePoll }) => {
	const [message, setMessage] = useState("");
	const [selectedFile, setSelectedFile] = useState(null);
	const [filePreview, setFilePreview] = useState(null);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [showGifPicker, setShowGifPicker] = useState(false);
	const [showCamera, setShowCamera] = useState(false);
	const [showImageEditor, setShowImageEditor] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const [recordingDuration, setRecordingDuration] = useState(0);
	const fileInputRef = useRef(null);
	const imageInputRef = useRef(null);
	const inputRef = useRef(null);
	const emojiPickerRef = useRef(null);
	const mediaRecorderRef = useRef(null);
	const chunksRef = useRef([]);
	const timerRef = useRef(null);
	const streamRef = useRef(null);

	const { loading, sendMessage } = useSendMessage();
	const { selectedConversation } = useConversation();
	const { handleTyping, stopTyping } = useTypingIndicator(selectedConversation?._id);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!message.trim() && !selectedFile) return;
		stopTyping();
		await sendMessage(message, selectedFile, replyingTo?._id || null);
		setMessage("");
		clearFile();
		onCancelReply?.();
	};

	const handleChange = (e) => {
		setMessage(e.target.value);
		handleTyping();
	};

	const onEmojiClick = (emojiObject) => {
		const input = inputRef.current;
		if (input) {
			const start = input.selectionStart;
			const end = input.selectionEnd;
			const newMessage = message.substring(0, start) + emojiObject.emoji + message.substring(end);
			setMessage(newMessage);
			setTimeout(() => {
				input.selectionStart = input.selectionEnd = start + emojiObject.emoji.length;
				input.focus();
			}, 0);
		} else {
			setMessage((prev) => prev + emojiObject.emoji);
		}
	};

	// Close emoji picker on outside click
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
				setShowEmojiPicker(false);
			}
		};
		if (showEmojiPicker) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [showEmojiPicker]);

	// GIF selected — send as a text message with the GIF URL
	const handleGifSelect = (gifUrl) => {
		sendMessage(gifUrl, null, replyingTo?._id || null);
		onCancelReply?.();
	};

	// Camera captured photo
	const handleCameraCapture = (file) => {
		setSelectedFile(file);
		const reader = new FileReader();
		reader.onload = (e) => setFilePreview(e.target.result);
		reader.readAsDataURL(file);
	};

	// Image editor saved
	const handleImageEditorSave = (editedFile) => {
		setSelectedFile(editedFile);
		const reader = new FileReader();
		reader.onload = (e) => setFilePreview(e.target.result);
		reader.readAsDataURL(editedFile);
		setShowImageEditor(false);
	};

	// Voice recording
	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			streamRef.current = stream;
			const mediaRecorder = new MediaRecorder(stream);
			mediaRecorderRef.current = mediaRecorder;
			chunksRef.current = [];

			mediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) chunksRef.current.push(e.data);
			};

			mediaRecorder.onstop = () => {
				const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
				const file = new File([blob], `voice-message-${Date.now()}.webm`, { type: "audio/webm" });
				sendMessage("", file);
				cleanupRecording();
			};

			mediaRecorder.start();
			setIsRecording(true);
			setRecordingDuration(0);
			timerRef.current = setInterval(() => {
				setRecordingDuration((prev) => prev + 1);
			}, 1000);
		} catch {
			alert("Microphone access denied. Please allow microphone access to record voice messages.");
		}
	};

	const stopRecording = () => {
		if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
			mediaRecorderRef.current.stop();
		}
	};

	const cancelRecording = () => {
		if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
			mediaRecorderRef.current.ondataavailable = null;
			mediaRecorderRef.current.onstop = null;
			mediaRecorderRef.current.stop();
		}
		cleanupRecording();
	};

	const cleanupRecording = () => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
		setIsRecording(false);
		setRecordingDuration(0);
		chunksRef.current = [];
	};

	const formatDuration = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const handleFileSelect = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (file.size > MAX_FILE_SIZE) {
			alert("File too large. Maximum size is 10MB.");
			return;
		}

		setSelectedFile(file);

		if (file.type.startsWith("image/")) {
			const reader = new FileReader();
			reader.onload = (e) => setFilePreview(e.target.result);
			reader.readAsDataURL(file);
		} else {
			setFilePreview(null);
		}
	};

	const clearFile = () => {
		setSelectedFile(null);
		setFilePreview(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
		if (imageInputRef.current) imageInputRef.current.value = "";
	};

	const formatFileSize = (bytes) => {
		if (bytes < 1024) return bytes + " B";
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
		return (bytes / (1024 * 1024)).toFixed(1) + " MB";
	};

	return (
		<div className='bg-base-200 border-t border-base-300 relative'>
			{/* Reply Preview */}
			{replyingTo && (
				<div className='px-4 pt-3'>
					<div className='bg-base-300 rounded-xl px-3 py-2 flex items-center gap-2 border-l-2 border-primary'>
						<div className='flex-1 min-w-0'>
							<p className='text-xs font-semibold text-primary'>
								{replyingTo.senderName || "Reply"}
							</p>
							<p className='text-xs text-slate-400 truncate'>
								{replyingTo.message || (replyingTo.file?.url ? `📎 ${replyingTo.file.name}` : "")}
							</p>
						</div>
						<button
							onClick={onCancelReply}
							className='p-1 text-slate-400 hover:text-white transition-colors flex-shrink-0'
						>
							<IoClose className='w-4 h-4' />
						</button>
					</div>
				</div>
			)}

			{/* File Preview */}
			{selectedFile && (
				<div className='px-4 pt-3'>
					<div className='bg-base-300 rounded-xl p-3 flex items-center gap-3 relative'>
						<button
							onClick={clearFile}
							className='absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors'
						>
							<IoClose className='w-4 h-4' />
						</button>

						{filePreview ? (
							<div className='relative'>
								<img src={filePreview} alt='preview' className='w-16 h-16 rounded-lg object-cover' />
								{/* Edit image button */}
								<button
									onClick={() => setShowImageEditor(true)}
									className='absolute -bottom-1 -right-1 w-6 h-6 bg-primary hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors'
									title='Edit image'
								>
									<IoBrush className='w-3 h-3' />
								</button>
							</div>
						) : (
							<div className='w-16 h-16 rounded-lg bg-base-100 flex items-center justify-center'>
								<IoAttach className='w-6 h-6 text-slate-400' />
							</div>
						)}

						<div className='flex-1 min-w-0'>
							<p className='text-sm text-white truncate'>{selectedFile.name}</p>
							<p className='text-xs text-slate-400'>{formatFileSize(selectedFile.size)}</p>
						</div>
					</div>
				</div>
			)}

			{/* Input Row */}
			<form className='px-4 py-3' onSubmit={handleSubmit}>
				{/* Emoji Picker */}
				{showEmojiPicker && (
					<div ref={emojiPickerRef} className='absolute bottom-20 left-4 z-50'>
						<EmojiPicker
							onEmojiClick={onEmojiClick}
							theme='dark'
							width={320}
							height={400}
							searchDisabled={false}
							skinTonesDisabled
							previewConfig={{ showPreview: false }}
						/>
					</div>
				)}

				{/* GIF Picker */}
				<GifPicker
					isOpen={showGifPicker}
					onClose={() => setShowGifPicker(false)}
					onSelect={handleGifSelect}
				/>

				{isRecording ? (
					<div className='flex items-center gap-3'>
						<button
							type='button'
							onClick={cancelRecording}
							className='p-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-base-300 transition-colors flex-shrink-0'
							title='Cancel'
						>
							<IoClose className='w-5 h-5' />
						</button>

						<div className='flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-base-300 border border-red-500/50'>
							<span className='w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse' />
							<span className='text-sm text-red-400 font-medium'>Recording</span>
							<span className='text-sm text-slate-400'>{formatDuration(recordingDuration)}</span>
						</div>

						<button
							type='button'
							onClick={stopRecording}
							className='p-3 rounded-xl bg-primary hover:bg-blue-600 text-white transition-colors flex-shrink-0'
							title='Send voice message'
						>
							<BsSend className='w-4 h-4' />
						</button>
					</div>
				) : (
					<div className='flex items-center gap-1'>
						{/* Emoji button */}
						<button
							type='button'
							onClick={() => { setShowEmojiPicker((p) => !p); setShowGifPicker(false); }}
							className='p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-base-300 transition-colors flex-shrink-0'
							title='Emoji'
						>
							<BsEmojiSmile className='w-5 h-5' />
						</button>

						{/* GIF button */}
						<button
							type='button'
							onClick={() => { setShowGifPicker((p) => !p); setShowEmojiPicker(false); }}
							className='p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-base-300 transition-colors flex-shrink-0'
							title='GIF'
						>
							<HiGif className='w-5 h-5' />
						</button>

						{/* Camera button */}
						<button
							type='button'
							onClick={() => setShowCamera(true)}
							className='p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-base-300 transition-colors flex-shrink-0'
							title='Camera'
						>
							<IoCamera className='w-5 h-5' />
						</button>

						{/* Image button */}
						<button
							type='button'
							onClick={() => imageInputRef.current?.click()}
							className='p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-base-300 transition-colors flex-shrink-0'
							title='Photo'
						>
							<IoImage className='w-5 h-5' />
						</button>

						{/* File button */}
						<button
							type='button'
							onClick={() => fileInputRef.current?.click()}
							className='p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-base-300 transition-colors flex-shrink-0'
							title='File'
						>
							<IoAttach className='w-5 h-5' />
						</button>

						{/* Poll button (groups only) */}
						{onCreatePoll && (
							<button
								type='button'
								onClick={onCreatePoll}
								className='p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-base-300 transition-colors flex-shrink-0'
								title='Create poll'
							>
								<IoBarChart className='w-5 h-5' />
							</button>
						)}

						{/* Hidden file inputs */}
						<input ref={imageInputRef} type='file' accept='image/*' className='hidden' onChange={handleFileSelect} />
						<input ref={fileInputRef} type='file' accept='.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.mp4,.webm,.mp3,.wav,.ogg' className='hidden' onChange={handleFileSelect} />

						{/* Text input */}
						<input
							ref={inputRef}
							type='text'
							className='flex-1 px-4 py-3 rounded-xl bg-base-300 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors'
							placeholder='Type a message...'
							value={message}
							onChange={handleChange}
							maxLength={5000}
						/>

						{/* Mic or Send */}
						{!message.trim() && !selectedFile ? (
							<button
								type='button'
								onClick={startRecording}
								className='p-2.5 rounded-xl text-slate-400 hover:text-primary hover:bg-base-300 transition-colors flex-shrink-0'
								title='Voice message'
							>
								<IoMic className='w-5 h-5' />
							</button>
						) : (
							<button
								type='submit'
								disabled={loading || (!message.trim() && !selectedFile)}
								className='p-2.5 rounded-xl bg-primary hover:bg-blue-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0'
							>
								{loading ? (
									<span className='loading loading-spinner loading-xs'></span>
								) : (
									<BsSend className='w-4 h-4' />
								)}
							</button>
						)}
					</div>
				)}
			</form>

			{/* Camera Capture */}
			<CameraCapture
				isOpen={showCamera}
				onClose={() => setShowCamera(false)}
				onCapture={handleCameraCapture}
			/>

			{/* Image Editor */}
			<ImageEditor
				isOpen={showImageEditor}
				onClose={() => setShowImageEditor(false)}
				imageFile={selectedFile}
				onSave={handleImageEditorSave}
			/>
		</div>
	);
};

export default MessageInput;
