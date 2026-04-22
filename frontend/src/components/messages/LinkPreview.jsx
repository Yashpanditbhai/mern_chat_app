import { useState, useEffect } from "react";
import { IoOpen } from "react-icons/io5";

const URL_REGEX = /https?:\/\/[^\s<]+/g;

export function extractUrls(text) {
	if (!text) return [];
	return text.match(URL_REGEX) || [];
}

const LinkPreview = ({ url, fromMe }) => {
	const [preview, setPreview] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		const fetchPreview = async () => {
			try {
				const res = await fetch(`/api/misc/link-preview?url=${encodeURIComponent(url)}`);
				if (!res.ok) throw new Error();
				const data = await res.json();
				if (!cancelled && data.title) setPreview(data);
			} catch {
				// Silently fail
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		fetchPreview();
		return () => { cancelled = true; };
	}, [url]);

	if (loading || !preview) return null;

	return (
		<a
			href={url}
			target='_blank'
			rel='noopener noreferrer'
			className={`block mx-2 mb-1 rounded-xl overflow-hidden border transition-colors ${
				fromMe
					? "border-blue-400/20 hover:border-blue-400/40"
					: "border-slate-600 hover:border-slate-500"
			}`}
		>
			{preview.image && (
				<img
					src={preview.image}
					alt={preview.title}
					className='w-full h-32 object-cover'
					loading='lazy'
					onError={(e) => { e.target.style.display = "none"; }}
				/>
			)}
			<div className={`px-3 py-2 ${fromMe ? "bg-blue-800/20" : "bg-base-300/50"}`}>
				<p className='text-xs text-slate-400 truncate'>{preview.siteName}</p>
				<p className='text-sm font-medium text-white truncate'>{preview.title}</p>
				{preview.description && (
					<p className='text-xs text-slate-400 line-clamp-2 mt-0.5'>{preview.description}</p>
				)}
				<div className='flex items-center gap-1 mt-1'>
					<IoOpen className='w-3 h-3 text-slate-500' />
					<span className='text-[10px] text-slate-500 truncate'>{url}</span>
				</div>
			</div>
		</a>
	);
};

export default LinkPreview;
