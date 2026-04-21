import { useState, useRef } from "react";
import { BsSend } from "react-icons/bs";
import { IoAttach, IoClose, IoImage } from "react-icons/io5";
import useSendMessage from "../../hooks/useSendMessage";
import useConversation from "../../zustand/useConversation";
import useTypingIndicator from "../../hooks/useTypingIndicator";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const MessageInput = () => {
	const [message, setMessage] = useState("");
	const [selectedFile, setSelectedFile] = useState(null);
	const [filePreview, setFilePreview] = useState(null);
	const fileInputRef = useRef(null);
	const imageInputRef = useRef(null);

	const { loading, sendMessage } = useSendMessage();
	const { selectedConversation } = useConversation();
	const { handleTyping, stopTyping } = useTypingIndicator(selectedConversation?._id);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!message.trim() && !selectedFile) return;
		stopTyping();
		await sendMessage(message, selectedFile);
		setMessage("");
		clearFile();
	};

	const handleChange = (e) => {
		setMessage(e.target.value);
		handleTyping();
	};

	const handleFileSelect = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (file.size > MAX_FILE_SIZE) {
			alert("File too large. Maximum size is 10MB.");
			return;
		}

		setSelectedFile(file);

		// Generate preview for images
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
		<div className='bg-base-200 border-t border-base-300'>
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
							<img
								src={filePreview}
								alt='preview'
								className='w-16 h-16 rounded-lg object-cover'
							/>
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
				<div className='flex items-center gap-2'>
					{/* Image button */}
					<button
						type='button'
						onClick={() => imageInputRef.current?.click()}
						className='p-2.5 rounded-xl text-slate-400 hover:text-primary hover:bg-base-300 transition-colors flex-shrink-0'
						title='Send photo'
					>
						<IoImage className='w-5 h-5' />
					</button>

					{/* File button */}
					<button
						type='button'
						onClick={() => fileInputRef.current?.click()}
						className='p-2.5 rounded-xl text-slate-400 hover:text-primary hover:bg-base-300 transition-colors flex-shrink-0'
						title='Send file'
					>
						<IoAttach className='w-5 h-5' />
					</button>

					{/* Hidden file inputs */}
					<input
						ref={imageInputRef}
						type='file'
						accept='image/*'
						className='hidden'
						onChange={handleFileSelect}
					/>
					<input
						ref={fileInputRef}
						type='file'
						accept='.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.mp4,.webm,.mp3,.wav,.ogg'
						className='hidden'
						onChange={handleFileSelect}
					/>

					{/* Text input */}
					<input
						type='text'
						className='flex-1 px-4 py-3 rounded-xl bg-base-300 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors'
						placeholder='Type a message...'
						value={message}
						onChange={handleChange}
						maxLength={5000}
					/>

					{/* Send button */}
					<button
						type='submit'
						disabled={loading || (!message.trim() && !selectedFile)}
						className='p-3 rounded-xl bg-primary hover:bg-blue-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0'
					>
						{loading ? (
							<span className='loading loading-spinner loading-xs'></span>
						) : (
							<BsSend className='w-4 h-4' />
						)}
					</button>
				</div>
			</form>
		</div>
	);
};

export default MessageInput;
