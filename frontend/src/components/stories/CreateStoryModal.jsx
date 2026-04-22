import { useState, useRef } from "react";
import { IoClose, IoImage } from "react-icons/io5";
import toast from "react-hot-toast";

const COLORS = [
	"#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
	"#EC4899", "#06B6D4", "#F97316", "#6366F1", "#14B8A6",
];

const CreateStoryModal = ({ isOpen, onClose, onCreated }) => {
	const [tab, setTab] = useState("text"); // "text" or "image"
	const [text, setText] = useState("");
	const [color, setColor] = useState(COLORS[0]);
	const [imageFile, setImageFile] = useState(null);
	const [imagePreview, setImagePreview] = useState(null);
	const [loading, setLoading] = useState(false);
	const fileRef = useRef(null);

	if (!isOpen) return null;

	const handleImageSelect = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.size > 10 * 1024 * 1024) {
			toast.error("Image too large (max 10MB)");
			return;
		}
		setImageFile(file);
		const reader = new FileReader();
		reader.onload = (ev) => setImagePreview(ev.target.result);
		reader.readAsDataURL(file);
	};

	const handleSubmit = async () => {
		if (tab === "text" && !text.trim()) {
			return toast.error("Enter some text for your story");
		}
		if (tab === "image" && !imageFile) {
			return toast.error("Select an image for your story");
		}

		setLoading(true);
		try {
			const formData = new FormData();
			formData.append("type", tab);

			if (tab === "text") {
				formData.append("content", text.trim());
				formData.append("color", color);
			} else {
				formData.append("content", "image");
				formData.append("file", imageFile);
			}

			const res = await fetch("/api/stories", {
				method: "POST",
				body: formData,
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			toast.success("Story posted!");
			onCreated?.();
			handleClose();
		} catch (error) {
			toast.error(error.message || "Failed to post story");
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setText("");
		setColor(COLORS[0]);
		setImageFile(null);
		setImagePreview(null);
		setTab("text");
		onClose();
	};

	return (
		<div className='fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4' onClick={handleClose}>
			<div
				className='bg-base-200 rounded-2xl w-full max-w-md flex flex-col overflow-hidden'
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className='flex items-center justify-between p-4 border-b border-base-300'>
					<h3 className='text-lg font-semibold text-white'>Create Story</h3>
					<button onClick={handleClose} className='p-1.5 hover:bg-base-300 rounded-full'>
						<IoClose className='w-5 h-5 text-slate-400' />
					</button>
				</div>

				{/* Tabs */}
				<div className='flex border-b border-base-300'>
					<button
						onClick={() => setTab("text")}
						className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === "text" ? "text-primary border-b-2 border-primary" : "text-slate-400"}`}
					>
						Text
					</button>
					<button
						onClick={() => setTab("image")}
						className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === "image" ? "text-primary border-b-2 border-primary" : "text-slate-400"}`}
					>
						Image
					</button>
				</div>

				{/* Content */}
				<div className='p-4'>
					{tab === "text" ? (
						<>
							{/* Preview */}
							<div
								className='rounded-xl h-48 flex items-center justify-center p-6 mb-4'
								style={{ backgroundColor: color }}
							>
								<p className='text-white text-lg font-semibold text-center break-words'>
									{text || "Your story text..."}
								</p>
							</div>

							{/* Text input */}
							<textarea
								value={text}
								onChange={(e) => setText(e.target.value)}
								placeholder='Write your story...'
								maxLength={500}
								className='w-full px-3 py-2 rounded-xl bg-base-300 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary resize-none h-20'
							/>

							{/* Color picker */}
							<div className='flex items-center gap-2 mt-3'>
								<span className='text-xs text-slate-400'>Background:</span>
								<div className='flex gap-1.5'>
									{COLORS.map((c) => (
										<button
											key={c}
											onClick={() => setColor(c)}
											className={`w-7 h-7 rounded-full transition-transform ${color === c ? "scale-110 ring-2 ring-white ring-offset-1 ring-offset-base-200" : ""}`}
											style={{ backgroundColor: c }}
										/>
									))}
								</div>
							</div>
						</>
					) : (
						<>
							{imagePreview ? (
								<div className='relative rounded-xl overflow-hidden mb-4'>
									<img src={imagePreview} alt='Preview' className='w-full max-h-64 object-contain bg-black rounded-xl' />
									<button
										onClick={() => { setImageFile(null); setImagePreview(null); }}
										className='absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white'
									>
										<IoClose className='w-4 h-4' />
									</button>
								</div>
							) : (
								<button
									onClick={() => fileRef.current?.click()}
									className='w-full h-48 rounded-xl border-2 border-dashed border-slate-600 flex flex-col items-center justify-center gap-2 hover:border-primary transition-colors mb-4'
								>
									<IoImage className='w-10 h-10 text-slate-400' />
									<span className='text-sm text-slate-400'>Click to select an image</span>
								</button>
							)}
							<input
								ref={fileRef}
								type='file'
								accept='image/*'
								className='hidden'
								onChange={handleImageSelect}
							/>
						</>
					)}
				</div>

				{/* Actions */}
				<div className='p-4 pt-0'>
					<button
						onClick={handleSubmit}
						disabled={loading}
						className='w-full py-2.5 rounded-xl bg-primary hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50'
					>
						{loading ? "Posting..." : "Post Story"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default CreateStoryModal;
