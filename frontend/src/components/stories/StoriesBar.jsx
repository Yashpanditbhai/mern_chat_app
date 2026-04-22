import { useState, useEffect } from "react";
import { IoAdd } from "react-icons/io5";
import { useAuthContext } from "../../context/AuthContext";
import { getProfilePic } from "../../utils/avatar";
import StoryViewer from "./StoryViewer";
import CreateStoryModal from "./CreateStoryModal";

const StoriesBar = () => {
	const { authUser } = useAuthContext();
	const [storyGroups, setStoryGroups] = useState([]);
	const [viewingStory, setViewingStory] = useState(null);
	const [showCreate, setShowCreate] = useState(false);

	const fetchStories = async () => {
		try {
			const res = await fetch("/api/stories");
			const data = await res.json();
			if (res.ok) setStoryGroups(data);
		} catch (error) {
			console.error("Failed to fetch stories:", error);
		}
	};

	useEffect(() => {
		fetchStories();
		const interval = setInterval(fetchStories, 30000);
		return () => clearInterval(interval);
	}, []);

	const myStories = storyGroups.find((g) => g.user._id === authUser._id);
	const otherStories = storyGroups.filter((g) => g.user._id !== authUser._id);

	return (
		<>
			<div className='px-4 py-3 border-b border-base-300'>
				<p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>Stories</p>
				<div className='flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin'>
					{/* Add story / My story */}
					<button
						onClick={() => myStories ? setViewingStory(myStories) : setShowCreate(true)}
						className='flex flex-col items-center gap-1 flex-shrink-0'
					>
						<div className='relative'>
							<div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${myStories ? 'border-primary' : 'border-base-300'}`}>
								<img
									src={getProfilePic(authUser)}
									alt='My story'
									className='w-full h-full object-cover'
								/>
							</div>
							{!myStories && (
								<div className='absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-base-200'>
									<IoAdd className='w-3 h-3 text-white' />
								</div>
							)}
						</div>
						<span className='text-[10px] text-slate-400 truncate w-14 text-center'>
							{myStories ? 'My Story' : 'Add'}
						</span>
					</button>

					{/* Other users' stories */}
					{otherStories.map((group) => {
						const allViewed = group.stories.every((s) =>
							(s.viewedBy || []).includes(authUser._id)
						);
						return (
							<button
								key={group.user._id}
								onClick={() => setViewingStory(group)}
								className='flex flex-col items-center gap-1 flex-shrink-0'
							>
								<div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${allViewed ? 'border-slate-600' : 'border-primary'}`}>
									<img
										src={getProfilePic(group.user)}
										alt={group.user.fullName}
										className='w-full h-full object-cover'
									/>
								</div>
								<span className='text-[10px] text-slate-400 truncate w-14 text-center'>
									{group.user.fullName?.split(' ')[0]}
								</span>
							</button>
						);
					})}

					{/* Always show add button if user has stories */}
					{myStories && (
						<button
							onClick={() => setShowCreate(true)}
							className='flex flex-col items-center gap-1 flex-shrink-0'
						>
							<div className='w-14 h-14 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center hover:border-primary transition-colors'>
								<IoAdd className='w-6 h-6 text-slate-400' />
							</div>
							<span className='text-[10px] text-slate-400'>New</span>
						</button>
					)}
				</div>
			</div>

			{/* Story Viewer */}
			{viewingStory && (
				<StoryViewer
					storyGroup={viewingStory}
					onClose={() => { setViewingStory(null); fetchStories(); }}
				/>
			)}

			{/* Create Story Modal */}
			<CreateStoryModal
				isOpen={showCreate}
				onClose={() => setShowCreate(false)}
				onCreated={fetchStories}
			/>
		</>
	);
};

export default StoriesBar;
