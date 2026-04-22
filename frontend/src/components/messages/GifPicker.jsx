import { useState, useEffect, useRef } from "react";
import { IoClose, IoSearch } from "react-icons/io5";

const GifPicker = ({ isOpen, onClose, onSelect }) => {
	const [search, setSearch] = useState("");
	const [gifs, setGifs] = useState([]);
	const [loading, setLoading] = useState(false);
	const debounceRef = useRef(null);
	const pickerRef = useRef(null);

	// Fetch GIFs
	useEffect(() => {
		if (!isOpen) return;

		const fetchGifs = async (query) => {
			setLoading(true);
			try {
				const url = query
					? `/api/misc/gifs?q=${encodeURIComponent(query)}`
					: `/api/misc/gifs`;
				const res = await fetch(url);
				const data = await res.json();
				if (Array.isArray(data)) setGifs(data);
			} catch (error) {
				console.error("Failed to fetch GIFs:", error);
			} finally {
				setLoading(false);
			}
		};

		// Debounce search
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			fetchGifs(search);
		}, search ? 400 : 0);

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [search, isOpen]);

	// Close on outside click
	useEffect(() => {
		const handle = (e) => {
			if (pickerRef.current && !pickerRef.current.contains(e.target)) {
				onClose();
			}
		};
		if (isOpen) document.addEventListener("mousedown", handle);
		return () => document.removeEventListener("mousedown", handle);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div
			ref={pickerRef}
			className='absolute bottom-20 left-4 z-50 bg-base-300 rounded-xl shadow-2xl border border-slate-700 w-[320px] h-[400px] flex flex-col overflow-hidden'
		>
			{/* Header */}
			<div className='flex items-center gap-2 p-3 border-b border-slate-700'>
				<div className='relative flex-1'>
					<IoSearch className='absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500' />
					<input
						type='text'
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder='Search GIFs...'
						className='w-full pl-8 pr-3 py-1.5 rounded-lg bg-base-100 text-sm text-white placeholder-slate-500 focus:outline-none'
						autoFocus
					/>
				</div>
				<button onClick={onClose} className='p-1 text-slate-400 hover:text-white'>
					<IoClose className='w-5 h-5' />
				</button>
			</div>

			{/* GIF Grid */}
			<div className='flex-1 overflow-y-auto p-2'>
				{loading ? (
					<div className='flex items-center justify-center h-full'>
						<span className='loading loading-spinner loading-md text-primary'></span>
					</div>
				) : gifs.length === 0 ? (
					<div className='flex items-center justify-center h-full'>
						<p className='text-sm text-slate-500'>No GIFs found</p>
					</div>
				) : (
					<div className='grid grid-cols-2 gap-1.5'>
						{gifs.map((gif) => (
							<img
								key={gif.id}
								src={gif.preview}
								alt={gif.title}
								className='w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity'
								onClick={() => {
									onSelect(gif.url);
									onClose();
								}}
								loading='lazy'
							/>
						))}
					</div>
				)}
			</div>

			{/* Powered by Giphy */}
			<div className='px-3 py-1.5 border-t border-slate-700'>
				<p className='text-[10px] text-slate-500 text-center'>Powered by GIPHY</p>
			</div>
		</div>
	);
};

export default GifPicker;
