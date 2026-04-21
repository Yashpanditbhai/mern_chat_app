import Conversations from "./Conversations";
import LogoutButton from "./LogoutButton";
import SearchInput from "./SearchInput";
import { useAuthContext } from "../../context/AuthContext";
import { getProfilePic } from "../../utils/avatar";

const Sidebar = () => {
	const { authUser } = useAuthContext();

	return (
		<div className='w-80 min-w-[320px] bg-base-200 border-r border-base-300 flex flex-col h-full'>
			{/* Header */}
			<div className='px-4 py-4 border-b border-base-300'>
				<div className='flex items-center justify-between mb-4'>
					<div className='flex items-center gap-3'>
						<div className='w-10 h-10 rounded-full overflow-hidden'>
							<img
								src={getProfilePic(authUser)}
								alt='profile'
								className='w-full h-full object-cover'
							/>
						</div>
						<div>
							<h2 className='font-semibold text-white text-sm'>{authUser?.fullName}</h2>
							<p className='text-xs text-slate-400'>@{authUser?.username}</p>
						</div>
					</div>
					<LogoutButton />
				</div>
				<SearchInput />
			</div>

			{/* Conversations list */}
			<div className='flex-1 overflow-y-auto'>
				<Conversations />
			</div>
		</div>
	);
};

export default Sidebar;
