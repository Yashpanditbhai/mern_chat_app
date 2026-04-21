import { BiLogOut } from "react-icons/bi";
import useLogout from "../../hooks/useLogout";

const LogoutButton = () => {
	const { loading, logout } = useLogout();

	return (
		<button
			onClick={logout}
			disabled={loading}
			className='p-2 rounded-lg hover:bg-base-300 transition-colors text-slate-400 hover:text-red-400'
			title='Logout'
		>
			{loading ? (
				<span className='loading loading-spinner loading-xs'></span>
			) : (
				<BiLogOut className='w-5 h-5' />
			)}
		</button>
	);
};

export default LogoutButton;
