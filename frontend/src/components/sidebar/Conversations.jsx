import useGetConversations from "../../hooks/useGetConversations";
import Conversation from "./Conversation";

const Conversations = () => {
	const { loading, conversations } = useGetConversations();

	if (loading) {
		return (
			<div className='flex justify-center py-8'>
				<span className='loading loading-spinner loading-md text-primary'></span>
			</div>
		);
	}

	if (conversations.length === 0) {
		return (
			<div className='text-center py-8 px-4'>
				<p className='text-slate-500 text-sm'>No users found</p>
			</div>
		);
	}

	return (
		<div className='py-1'>
			{conversations.map((conversation) => (
				<Conversation key={conversation._id} conversation={conversation} />
			))}
		</div>
	);
};

export default Conversations;
