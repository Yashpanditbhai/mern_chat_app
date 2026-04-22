import { useState, useEffect } from "react";
import Conversations from "./Conversations";
import LogoutButton from "./LogoutButton";
import SearchInput from "./SearchInput";
import ProfileModal from "./ProfileModal";
import CreateGroupModal from "./CreateGroupModal";
import GroupConversation from "./GroupConversation";
import { useAuthContext } from "../../context/AuthContext";
import { getProfilePic } from "../../utils/avatar";
import useConversation from "../../zustand/useConversation";
import SettingsModal from "./SettingsModal";
import { IoAdd, IoSettings } from "react-icons/io5";
import { BsRobot } from "react-icons/bs";
import StoriesBar from "../stories/StoriesBar";
import { useLanguage } from "../../context/LanguageContext";

const Sidebar = () => {
	const { authUser } = useAuthContext();
	const { t } = useLanguage();
	const [showProfile, setShowProfile] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [showCreateGroup, setShowCreateGroup] = useState(false);
	const { groups, setGroups, setSelectedConversation } = useConversation();
	const [showAI, setShowAI] = useState(false);

	// Fetch groups on mount
	useEffect(() => {
		const fetchGroups = async () => {
			try {
				const res = await fetch("/api/groups");
				const data = await res.json();
				if (res.ok) setGroups(data);
			} catch (error) {
				console.error("Failed to fetch groups:", error);
			}
		};
		fetchGroups();
	}, [setGroups]);

	return (
		<div className='w-80 min-w-[320px] bg-base-200 border-r border-base-300 flex flex-col h-full'>
			{/* Header */}
			<div className='px-4 py-4 border-b border-base-300'>
				<div className='flex items-center justify-between mb-4'>
					<div
						className='flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity'
						onClick={() => setShowProfile(true)}
						title='Edit profile'
					>
						<div className='w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-primary transition-colors'>
							<img
								src={getProfilePic(authUser)}
								alt='profile'
								className='w-full h-full object-cover'
							/>
						</div>
						<div>
							<h2 className='font-semibold text-white text-sm'>{authUser?.fullName}</h2>
							<p className='text-xs text-slate-400'>
								{authUser?.statusText || `@${authUser?.username}`}
							</p>
						</div>
					</div>
					<div className='flex items-center gap-1'>
						<button
							onClick={() => setShowCreateGroup(true)}
							className='p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-base-300 transition-colors'
							title={t("newGroup")}
						>
							<IoAdd className='w-5 h-5' />
						</button>
						<button
							onClick={() => setShowSettings(true)}
							className='p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-base-300 transition-colors'
							title={t("settings")}
						>
							<IoSettings className='w-5 h-5' />
						</button>
						<LogoutButton />
					</div>
				</div>
				<SearchInput />
			</div>

			{/* Stories */}
			<StoriesBar />

			{/* Conversations & Groups list */}
			<div className='flex-1 overflow-y-auto'>
				{/* AI Assistant */}
				<div className='px-2 py-1'>
					<button
						onClick={() => {
							setSelectedConversation({ _id: "__ai_assistant__", fullName: t("aiAssistant"), isAI: true });
						}}
						className='w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-base-300 transition-colors'
					>
						<div className='w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0'>
							<BsRobot className='w-5 h-5 text-purple-400' />
						</div>
						<div className='text-left'>
							<p className='text-sm font-medium text-white'>{t("aiAssistant")}</p>
							<p className='text-xs text-slate-400'>{t("askAnything")}</p>
						</div>
					</button>
				</div>

				{/* Groups */}
				{groups && groups.length > 0 && (
					<>
						<div className='px-4 py-2'>
							<p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>{t("groups")}</p>
						</div>
						{groups.map((group) => (
							<GroupConversation key={group._id} group={group} />
						))}
						<div className='px-4 py-2'>
							<p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>{t("directMessages")}</p>
						</div>
					</>
				)}
				<Conversations />
			</div>

			{/* Modals */}
			<ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
			<CreateGroupModal isOpen={showCreateGroup} onClose={() => setShowCreateGroup(false)} />
			<SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
		</div>
	);
};

export default Sidebar;
