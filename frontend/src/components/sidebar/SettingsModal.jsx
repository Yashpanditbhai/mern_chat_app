import { IoClose, IoSunny, IoMoon } from "react-icons/io5";
import { useTheme } from "../../context/ThemeContext";

const WALLPAPERS = [
	{ id: "", label: "None", color: "transparent" },
	{ id: "dots", label: "Dots", color: "#1a1a2e" },
	{ id: "gradient1", label: "Ocean", color: "linear-gradient(135deg, #0c1445 0%, #1a237e 100%)" },
	{ id: "gradient2", label: "Forest", color: "linear-gradient(135deg, #0d1b0e 0%, #1b3a1e 100%)" },
	{ id: "gradient3", label: "Sunset", color: "linear-gradient(135deg, #1a0a2e 0%, #2d1b42 100%)" },
	{ id: "gradient4", label: "Warm", color: "linear-gradient(135deg, #2d1f0e 0%, #3d2b15 100%)" },
	{ id: "solid1", label: "Dark Blue", color: "#0f1729" },
	{ id: "solid2", label: "Charcoal", color: "#1a1a1a" },
];

const SettingsModal = ({ isOpen, onClose }) => {
	const { isDark, toggleTheme, chatWallpaper, setChatWallpaper } = useTheme();

	if (!isOpen) return null;

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

				<h3 className='text-lg font-semibold text-white mb-5'>Settings</h3>

				{/* Theme Toggle */}
				<div className='mb-6'>
					<label className='text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 block'>
						Theme
					</label>
					<button
						onClick={toggleTheme}
						className='w-full flex items-center justify-between px-4 py-3 rounded-xl bg-base-300 hover:bg-base-100 transition-colors'
					>
						<div className='flex items-center gap-3'>
							{isDark ? (
								<IoMoon className='w-5 h-5 text-blue-400' />
							) : (
								<IoSunny className='w-5 h-5 text-yellow-400' />
							)}
							<span className='text-sm text-white'>
								{isDark ? "Dark Mode" : "Light Mode"}
							</span>
						</div>
						<span className='text-xs text-slate-400'>
							Switch to {isDark ? "light" : "dark"}
						</span>
					</button>
				</div>

				{/* Chat Wallpaper */}
				<div>
					<label className='text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 block'>
						Chat Wallpaper
					</label>
					<div className='grid grid-cols-4 gap-2'>
						{WALLPAPERS.map((wp) => (
							<button
								key={wp.id}
								onClick={() => setChatWallpaper(wp.id)}
								className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
									chatWallpaper === wp.id
										? "ring-2 ring-primary bg-base-300"
										: "hover:bg-base-300"
								}`}
							>
								<div
									className='w-10 h-10 rounded-lg border border-slate-600'
									style={{
										background: wp.color,
									}}
								/>
								<span className='text-[10px] text-slate-400'>{wp.label}</span>
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default SettingsModal;

export function getWallpaperStyle(wallpaperId) {
	switch (wallpaperId) {
		case "dots":
			return {
				backgroundImage: "radial-gradient(circle, #ffffff08 1px, transparent 1px)",
				backgroundSize: "20px 20px",
				backgroundColor: "#0f172a",
			};
		case "gradient1":
			return { background: "linear-gradient(135deg, #0c1445 0%, #1a237e 100%)" };
		case "gradient2":
			return { background: "linear-gradient(135deg, #0d1b0e 0%, #1b3a1e 100%)" };
		case "gradient3":
			return { background: "linear-gradient(135deg, #1a0a2e 0%, #2d1b42 100%)" };
		case "gradient4":
			return { background: "linear-gradient(135deg, #2d1f0e 0%, #3d2b15 100%)" };
		case "solid1":
			return { backgroundColor: "#0f1729" };
		case "solid2":
			return { backgroundColor: "#1a1a1a" };
		default:
			return {};
	}
}
