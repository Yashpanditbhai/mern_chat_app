import { useState, useEffect, useMemo } from "react";
import { IoClose, IoDownload, IoImages, IoVideocam, IoMusicalNotes, IoDocument } from "react-icons/io5";
import useConversation from "../../zustand/useConversation";
import ImagePreviewModal from "./ImagePreviewModal";
import { useLanguage } from "../../context/LanguageContext";

const TABS = [
	{ key: "images", icon: IoImages, color: "text-blue-400" },
	{ key: "videos", icon: IoVideocam, color: "text-red-400" },
	{ key: "audio", icon: IoMusicalNotes, color: "text-green-400" },
	{ key: "documents", icon: IoDocument, color: "text-yellow-400" },
];

const SharedMediaPanel = ({ isOpen, onClose }) => {
	const { t } = useLanguage();
	const { messages, selectedConversation } = useConversation();
	const [activeTab, setActiveTab] = useState("images");
	const [apiMedia, setApiMedia] = useState(null);
	const [loading, setLoading] = useState(false);
	const [previewImage, setPreviewImage] = useState(null);

	// Extract media from loaded messages in zustand
	const localMedia = useMemo(() => {
		const grouped = { images: [], videos: [], audio: [], documents: [] };
		if (!messages) return grouped;

		for (const msg of messages) {
			if (!msg.file?.url || msg.deletedForEveryone) continue;
			const item = {
				_id: msg._id,
				url: msg.file.url,
				name: msg.file.name,
				type: msg.file.type,
				mimeType: msg.file.mimeType,
				size: msg.file.size,
				createdAt: msg.createdAt,
				senderName: msg.senderId?.fullName || msg.senderName || "",
			};
			const category = msg.file.type === "image" ? "images"
				: msg.file.type === "video" ? "videos"
				: msg.file.type === "audio" ? "audio"
				: "documents";
			grouped[category].push(item);
		}
		return grouped;
	}, [messages]);

	// Fetch from API for complete data (fallback)
	useEffect(() => {
		if (!isOpen || !selectedConversation?._id || selectedConversation.isGroupChat) return;
		const fetchMedia = async () => {
			setLoading(true);
			try {
				const res = await fetch(`/api/messages/media/${selectedConversation._id}`);
				const data = await res.json();
				if (res.ok) setApiMedia(data);
			} catch (error) {
				console.error("Failed to fetch media:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchMedia();
	}, [isOpen, selectedConversation?._id, selectedConversation?.isGroupChat]);

	// Use API data if available, otherwise local
	const media = apiMedia || localMedia;

	const formatSize = (bytes) => {
		if (!bytes) return "";
		if (bytes < 1024) return bytes + " B";
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
		return (bytes / (1024 * 1024)).toFixed(1) + " MB";
	};

	const formatDate = (dateStr) => {
		if (!dateStr) return "";
		return new Date(dateStr).toLocaleDateString(undefined, {
			month: "short", day: "numeric", year: "numeric",
		});
	};

	const handleDownload = (url, name) => {
		const a = document.createElement("a");
		a.href = url;
		a.download = name || "file";
		a.target = "_blank";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	if (!isOpen) return null;

	const currentItems = media[activeTab] || [];
	const allImages = (media.images || []).map((img) => ({ url: img.url, name: img.name }));

	return (
		<>
			<div className='fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4' onClick={onClose}>
				<div
					className='bg-base-200 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col'
					onClick={(e) => e.stopPropagation()}
				>
					<div className='flex items-center justify-between p-4 border-b border-base-300'>
						<h3 className='text-lg font-semibold text-white'>{t("sharedMedia")}</h3>
						<button onClick={onClose} className='p-1.5 hover:bg-base-300 rounded-full'>
							<IoClose className='w-5 h-5 text-slate-400' />
						</button>
					</div>

					{/* Tabs */}
					<div className='flex border-b border-base-300'>
						{TABS.map((tab) => {
							const Icon = tab.icon;
							const count = (media[tab.key] || []).length;
							return (
								<button
									key={tab.key}
									onClick={() => setActiveTab(tab.key)}
									className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors border-b-2 ${
										activeTab === tab.key
											? "border-primary text-primary"
											: "border-transparent text-slate-400 hover:text-slate-200"
									}`}
								>
									<Icon className='w-4 h-4' />
									<span>{t(tab.key)}</span>
									{count > 0 && (
										<span className='text-[10px] px-1.5 py-0.5 rounded-full bg-base-300'>{count}</span>
									)}
								</button>
							);
						})}
					</div>

					{/* Content */}
					<div className='flex-1 overflow-y-auto p-4'>
						{loading && (
							<div className='flex justify-center py-8'>
								<span className='loading loading-spinner loading-md text-primary'></span>
							</div>
						)}

						{!loading && currentItems.length === 0 && (
							<p className='text-sm text-slate-500 text-center py-8'>{t("noMedia")}</p>
						)}

						{!loading && activeTab === "images" && currentItems.length > 0 && (
							<div className='grid grid-cols-3 gap-2'>
								{currentItems.map((item) => (
									<button
										key={item._id}
										onClick={() => setPreviewImage(item)}
										className='aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity bg-base-300'
									>
										<img
											src={item.url}
											alt={item.name}
											className='w-full h-full object-cover'
											loading='lazy'
										/>
									</button>
								))}
							</div>
						)}

						{!loading && activeTab !== "images" && currentItems.length > 0 && (
							<div className='space-y-2'>
								{currentItems.map((item) => (
									<div
										key={item._id}
										className='flex items-center gap-3 p-3 bg-base-300 rounded-xl'
									>
										<div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
											activeTab === "videos" ? "bg-red-500/20" :
											activeTab === "audio" ? "bg-green-500/20" : "bg-yellow-500/20"
										}`}>
											{activeTab === "videos" && <IoVideocam className='w-5 h-5 text-red-400' />}
											{activeTab === "audio" && <IoMusicalNotes className='w-5 h-5 text-green-400' />}
											{activeTab === "documents" && <IoDocument className='w-5 h-5 text-yellow-400' />}
										</div>
										<div className='flex-1 min-w-0'>
											<p className='text-sm text-white truncate'>{item.name}</p>
											<p className='text-xs text-slate-400'>
												{formatSize(item.size)} {item.createdAt && `· ${formatDate(item.createdAt)}`}
											</p>
										</div>
										<button
											onClick={() => handleDownload(item.url, item.name)}
											className='p-2 text-slate-400 hover:text-primary hover:bg-base-100 rounded-lg transition-colors flex-shrink-0'
											title={t("download")}
										>
											<IoDownload className='w-4 h-4' />
										</button>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Image Preview */}
			<ImagePreviewModal
				isOpen={!!previewImage}
				onClose={() => setPreviewImage(null)}
				imageUrl={previewImage?.url}
				imageName={previewImage?.name}
				allImages={allImages}
			/>
		</>
	);
};

export default SharedMediaPanel;
