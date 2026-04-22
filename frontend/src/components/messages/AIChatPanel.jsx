import { useState, useRef, useEffect } from "react";
import { BsSend, BsRobot } from "react-icons/bs";
import { IoClose } from "react-icons/io5";
import { useAuthContext } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const AIChatPanel = ({ isOpen, onClose }) => {
	const { authUser } = useAuthContext();
	const { t } = useLanguage();
	const [messages, setMessages] = useState([
		{ role: "bot", text: "Hi! I'm Flash Bot, your assistant. Ask me about Flash Chat features or just say hello!" },
	]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const messagesEndRef = useRef(null);
	const inputRef = useRef(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	useEffect(() => {
		if (isOpen) inputRef.current?.focus();
	}, [isOpen]);

	const handleSend = async (e) => {
		e.preventDefault();
		if (!input.trim() || loading) return;

		const userMsg = input.trim();
		setInput("");
		setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
		setLoading(true);

		try {
			const res = await fetch("/api/misc/ai-chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: userMsg }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			setMessages((prev) => [...prev, { role: "bot", text: data.response }]);
		} catch (error) {
			setMessages((prev) => [...prev, { role: "bot", text: "Sorry, something went wrong. Try again!" }]);
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className='flex-1 flex flex-col h-full bg-base-100'>
			{/* Header */}
			<div className='px-5 py-3 bg-base-200 border-b border-base-300 flex items-center gap-3'>
				<div className='w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center'>
					<BsRobot className='w-5 h-5 text-purple-400' />
				</div>
				<div className='flex-1'>
					<h3 className='font-semibold text-white text-sm'>{t("aiAssistant")}</h3>
					<p className='text-xs text-green-400'>{t("online")}</p>
				</div>
				<button
					onClick={onClose}
					className='p-2 rounded-lg text-slate-400 hover:text-white hover:bg-base-300 transition-colors'
				>
					<IoClose className='w-5 h-5' />
				</button>
			</div>

			{/* Messages */}
			<div className='flex-1 overflow-y-auto px-4 py-3 space-y-3'>
				{messages.map((msg, i) => (
					<div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
						<div
							className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
								msg.role === "user"
									? "bg-primary text-white rounded-br-md"
									: "bg-base-300 text-slate-200 rounded-bl-md"
							}`}
						>
							{msg.text}
						</div>
					</div>
				))}
				{loading && (
					<div className='flex justify-start'>
						<div className='bg-base-300 rounded-2xl rounded-bl-md px-4 py-2.5'>
							<span className='loading loading-dots loading-sm text-slate-400'></span>
						</div>
					</div>
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Input */}
			<form className='px-4 py-3 bg-base-200 border-t border-base-300' onSubmit={handleSend}>
				<div className='flex items-center gap-2'>
					<input
						ref={inputRef}
						type='text'
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder={t("askAI")}
						className='flex-1 px-4 py-3 rounded-xl bg-base-300 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors'
						maxLength={1000}
					/>
					<button
						type='submit'
						disabled={!input.trim() || loading}
						className='p-2.5 rounded-xl bg-primary hover:bg-blue-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0'
					>
						<BsSend className='w-4 h-4' />
					</button>
				</div>
			</form>
		</div>
	);
};

export default AIChatPanel;
