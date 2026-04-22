import { useState, useRef } from "react";
import { IoClose, IoSearch } from "react-icons/io5";
import { getProfilePic } from "../../utils/avatar";
import { extractTime } from "../../utils/extractTime";

const SearchPanel = ({ isOpen, onClose, conversationId }) => {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState([]);
	const [loading, setLoading] = useState(false);
	const debounceRef = useRef(null);

	const handleSearch = (q) => {
		setQuery(q);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		if (!q.trim()) {
			setResults([]);
			return;
		}
		debounceRef.current = setTimeout(async () => {
			setLoading(true);
			try {
				const params = new URLSearchParams({ q });
				if (conversationId) params.append("conversationWith", conversationId);
				const res = await fetch(`/api/messages/search/query?${params}`);
				const data = await res.json();
				if (Array.isArray(data)) setResults(data);
			} catch (error) {
				console.error("Search error:", error);
			} finally {
				setLoading(false);
			}
		}, 400);
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4' onClick={onClose}>
			<div
				className='bg-base-200 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col'
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className='flex items-center gap-2 p-4 pb-2'>
					<div className='relative flex-1'>
						<IoSearch className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500' />
						<input
							type='text'
							value={query}
							onChange={(e) => handleSearch(e.target.value)}
							placeholder='Search messages...'
							autoFocus
							className='w-full pl-9 pr-3 py-2.5 rounded-xl bg-base-300 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary'
						/>
					</div>
					<button onClick={onClose} className='p-2 text-slate-400 hover:text-white'>
						<IoClose className='w-5 h-5' />
					</button>
				</div>

				{/* Results */}
				<div className='flex-1 overflow-y-auto px-4 pb-4'>
					{loading && (
						<div className='flex justify-center py-8'>
							<span className='loading loading-spinner loading-md text-primary'></span>
						</div>
					)}

					{!loading && query && results.length === 0 && (
						<p className='text-sm text-slate-500 text-center py-8'>No messages found</p>
					)}

					{!loading && results.map((msg) => {
						const sender = msg.senderId;
						return (
							<div key={msg._id} className='py-2.5 border-b border-base-300 last:border-0'>
								<div className='flex items-center gap-2 mb-1'>
									{sender && typeof sender === "object" && (
										<div className='w-6 h-6 rounded-full overflow-hidden'>
											<img src={getProfilePic(sender)} alt='' className='w-full h-full object-cover' />
										</div>
									)}
									<span className='text-xs font-semibold text-white'>
										{sender?.fullName || "Unknown"}
									</span>
									<span className='text-[10px] text-slate-500'>
										{extractTime(msg.createdAt)}
									</span>
								</div>
								<p className='text-sm text-slate-300 pl-8'>
									{highlightMatch(msg.message, query)}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

function highlightMatch(text, query) {
	if (!text || !query) return text;
	const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
	return parts.map((part, i) =>
		part.toLowerCase() === query.toLowerCase() ? (
			<mark key={i} className='bg-yellow-500/30 text-yellow-300 rounded px-0.5'>
				{part}
			</mark>
		) : (
			part
		)
	);
}

export default SearchPanel;
