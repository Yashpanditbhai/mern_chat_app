import { useState } from "react";
import { IoClose, IoAdd, IoTrash } from "react-icons/io5";
import useConversation from "../../zustand/useConversation";
import toast from "react-hot-toast";

const CreatePollModal = ({ isOpen, onClose, conversationId }) => {
	const [question, setQuestion] = useState("");
	const [options, setOptions] = useState(["", ""]);
	const [loading, setLoading] = useState(false);
	const { addPoll } = useConversation();

	if (!isOpen) return null;

	const addOption = () => {
		if (options.length >= 10) return;
		setOptions([...options, ""]);
	};

	const removeOption = (idx) => {
		if (options.length <= 2) return;
		setOptions(options.filter((_, i) => i !== idx));
	};

	const updateOption = (idx, value) => {
		const updated = [...options];
		updated[idx] = value;
		setOptions(updated);
	};

	const handleSubmit = async () => {
		if (!question.trim()) return toast.error("Enter a question");
		const validOptions = options.filter((o) => o.trim());
		if (validOptions.length < 2) return toast.error("Add at least 2 options");

		setLoading(true);
		try {
			const res = await fetch(`/api/groups/${conversationId}/poll`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ question: question.trim(), options: validOptions }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			toast.success("Poll created!");
			handleClose();
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setQuestion("");
		setOptions(["", ""]);
		onClose();
	};

	return (
		<div className='fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4' onClick={handleClose}>
			<div
				className='bg-base-200 rounded-2xl w-full max-w-md flex flex-col'
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className='flex items-center justify-between p-4 border-b border-base-300'>
					<h3 className='text-lg font-semibold text-white'>Create Poll</h3>
					<button onClick={handleClose} className='p-1.5 hover:bg-base-300 rounded-full'>
						<IoClose className='w-5 h-5 text-slate-400' />
					</button>
				</div>

				{/* Content */}
				<div className='p-4 space-y-4'>
					{/* Question */}
					<div>
						<label className='text-xs text-slate-400 mb-1 block'>Question</label>
						<input
							type='text'
							value={question}
							onChange={(e) => setQuestion(e.target.value)}
							placeholder='Ask a question...'
							maxLength={500}
							className='w-full px-3 py-2.5 rounded-xl bg-base-300 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary'
						/>
					</div>

					{/* Options */}
					<div>
						<label className='text-xs text-slate-400 mb-1 block'>Options</label>
						<div className='space-y-2'>
							{options.map((opt, idx) => (
								<div key={idx} className='flex items-center gap-2'>
									<input
										type='text'
										value={opt}
										onChange={(e) => updateOption(idx, e.target.value)}
										placeholder={`Option ${idx + 1}`}
										maxLength={200}
										className='flex-1 px-3 py-2 rounded-xl bg-base-300 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary'
									/>
									{options.length > 2 && (
										<button
											onClick={() => removeOption(idx)}
											className='p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors'
										>
											<IoTrash className='w-4 h-4' />
										</button>
									)}
								</div>
							))}
						</div>
						{options.length < 10 && (
							<button
								onClick={addOption}
								className='flex items-center gap-1 text-sm text-primary hover:text-blue-400 mt-2 transition-colors'
							>
								<IoAdd className='w-4 h-4' /> Add option
							</button>
						)}
					</div>
				</div>

				{/* Actions */}
				<div className='p-4 pt-0'>
					<button
						onClick={handleSubmit}
						disabled={loading}
						className='w-full py-2.5 rounded-xl bg-primary hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50'
					>
						{loading ? "Creating..." : "Create Poll"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default CreatePollModal;
