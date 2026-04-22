import { IoClose, IoDocumentText, IoPrint } from "react-icons/io5";
import useConversation from "../../zustand/useConversation";
import { useAuthContext } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const ExportChatModal = ({ isOpen, onClose }) => {
	const { messages, selectedConversation } = useConversation();
	const { authUser } = useAuthContext();
	const { t } = useLanguage();

	if (!isOpen) return null;

	const chatName = selectedConversation?.isGroupChat
		? selectedConversation.groupName
		: selectedConversation?.fullName || "Chat";

	const formatMessageLine = (msg) => {
		const time = new Date(msg.createdAt).toLocaleString();
		let senderName;
		if (selectedConversation?.isGroupChat) {
			senderName = msg.senderId?.fullName || msg.senderName || "Unknown";
		} else {
			senderName =
				(msg.senderId === authUser._id || msg.senderId?._id === authUser._id)
					? authUser.fullName
					: selectedConversation.fullName;
		}
		let content = msg.message || "";
		if (msg.deletedForEveryone) content = "[Deleted message]";
		if (msg.file?.url) content += content ? ` [File: ${msg.file.name}]` : `[File: ${msg.file.name}]`;
		return `[${time}] ${senderName}: ${content}`;
	};

	const handleExportText = () => {
		const lines = messages.map(formatMessageLine);
		const header = `Chat Export: ${chatName}\nExported on: ${new Date().toLocaleString()}\n${"=".repeat(50)}\n\n`;
		const content = header + lines.join("\n");
		const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${chatName.replace(/[^a-zA-Z0-9]/g, "_")}_chat_export.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		onClose();
	};

	const handleExportPDF = () => {
		const lines = messages.map(formatMessageLine);
		const htmlContent = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>Chat Export - ${chatName}</title>
				<style>
					body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
					h1 { font-size: 20px; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 4px; }
					.meta { font-size: 12px; color: #666; margin-bottom: 24px; }
					.msg { padding: 6px 0; border-bottom: 1px solid #eee; font-size: 13px; }
					.msg:last-child { border-bottom: none; }
				</style>
			</head>
			<body>
				<h1>Chat Export: ${chatName}</h1>
				<p class="meta">Exported on ${new Date().toLocaleString()} &mdash; ${messages.length} messages</p>
				${lines.map((l) => `<div class="msg">${l.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`).join("")}
			</body>
			</html>
		`;
		const printWindow = window.open("", "_blank");
		if (printWindow) {
			printWindow.document.write(htmlContent);
			printWindow.document.close();
			printWindow.focus();
			setTimeout(() => printWindow.print(), 500);
		}
		onClose();
	};

	return (
		<div className='fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4' onClick={onClose}>
			<div
				className='bg-base-200 rounded-2xl w-full max-w-sm p-6 relative'
				onClick={(e) => e.stopPropagation()}
			>
				<button
					onClick={onClose}
					className='absolute top-3 right-3 p-1.5 hover:bg-base-300 rounded-full transition-colors'
				>
					<IoClose className='w-5 h-5 text-slate-400' />
				</button>

				<h3 className='text-lg font-semibold text-white mb-1'>{t("exportChat")}</h3>
				<p className='text-sm text-slate-400 mb-5'>
					{messages.length} {t("messages")} &mdash; {chatName}
				</p>

				<div className='space-y-3'>
					<button
						onClick={handleExportText}
						className='w-full flex items-center gap-3 px-4 py-3 bg-base-300 hover:bg-base-100 rounded-xl transition-colors'
					>
						<div className='w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center'>
							<IoDocumentText className='w-5 h-5 text-blue-400' />
						</div>
						<div className='text-left'>
							<p className='text-sm font-medium text-white'>{t("exportAsText")}</p>
							<p className='text-xs text-slate-400'>{t("exportTextDesc")}</p>
						</div>
					</button>

					<button
						onClick={handleExportPDF}
						className='w-full flex items-center gap-3 px-4 py-3 bg-base-300 hover:bg-base-100 rounded-xl transition-colors'
					>
						<div className='w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center'>
							<IoPrint className='w-5 h-5 text-purple-400' />
						</div>
						<div className='text-left'>
							<p className='text-sm font-medium text-white'>{t("exportAsPDF")}</p>
							<p className='text-xs text-slate-400'>{t("exportPDFDesc")}</p>
						</div>
					</button>
				</div>
			</div>
		</div>
	);
};

export default ExportChatModal;
