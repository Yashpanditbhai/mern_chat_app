import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { useAuthContext } from "../../context/AuthContext";
import useConversation from "../../zustand/useConversation";
import toast from "react-hot-toast";

const PollsList = ({ isOpen, onClose, conversationId }) => {
	const { authUser } = useAuthContext();
	const { polls, setPolls, updatePoll } = useConversation();
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!isOpen || !conversationId) return;
		const fetchPolls = async () => {
			setLoading(true);
			try {
				const res = await fetch(`/api/groups/${conversationId}/polls`);
				const data = await res.json();
				if (res.ok) setPolls(data);
			} catch (error) {
				console.error("Failed to fetch polls:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchPolls();
	}, [isOpen, conversationId, setPolls]);

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4' onClick={onClose}>
			<div
				className='bg-base-200 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col'
				onClick={(e) => e.stopPropagation()}
			>
				<div className='flex items-center justify-between p-4 border-b border-base-300'>
					<h3 className='text-lg font-semibold text-white'>Polls</h3>
					<button onClick={onClose} className='p-1.5 hover:bg-base-300 rounded-full'>
						<IoClose className='w-5 h-5 text-slate-400' />
					</button>
				</div>

				<div className='flex-1 overflow-y-auto p-4 space-y-4'>
					{loading ? (
						<div className='flex justify-center py-8'>
							<span className='loading loading-spinner loading-md text-primary'></span>
						</div>
					) : polls.length === 0 ? (
						<p className='text-center text-slate-500 text-sm py-8'>No polls yet</p>
					) : (
						polls.map((poll) => (
							<PollCard key={poll._id} poll={poll} authUser={authUser} updatePoll={updatePoll} />
						))
					)}
				</div>
			</div>
		</div>
	);
};

const PollCard = ({ poll, authUser, updatePoll }) => {
	const [voting, setVoting] = useState(false);

	const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);

	const userVoteIndex = poll.options.findIndex((opt) =>
		(opt.votes || []).some((v) => {
			const vid = v?._id || v;
			return vid?.toString() === authUser._id;
		})
	);

	const handleVote = async (optionIndex) => {
		setVoting(true);
		try {
			const res = await fetch(`/api/polls/${poll._id}/vote`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ optionIndex }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			updatePoll(data);
		} catch (error) {
			toast.error(error.message);
		} finally {
			setVoting(false);
		}
	};

	return (
		<div className='bg-base-300 rounded-xl p-4'>
			<div className='flex items-center gap-2 mb-1'>
				<p className='text-xs text-slate-400'>
					{poll.createdBy?.fullName || "Unknown"}
				</p>
			</div>
			<h4 className='text-sm font-semibold text-white mb-3'>{poll.question}</h4>

			<div className='space-y-2'>
				{poll.options.map((option, idx) => {
					const voteCount = option.votes?.length || 0;
					const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
					const isMyVote = idx === userVoteIndex;

					return (
						<button
							key={idx}
							onClick={() => handleVote(idx)}
							disabled={voting}
							className={`w-full text-left relative rounded-lg overflow-hidden transition-colors ${
								isMyVote
									? "ring-1 ring-primary"
									: "hover:bg-base-100"
							}`}
						>
							{/* Background bar */}
							<div
								className={`absolute inset-0 ${isMyVote ? "bg-primary/20" : "bg-base-100/50"}`}
								style={{ width: `${percentage}%` }}
							/>
							<div className='relative flex items-center justify-between px-3 py-2.5'>
								<span className={`text-sm ${isMyVote ? "text-primary font-medium" : "text-slate-300"}`}>
									{option.text}
								</span>
								<span className='text-xs text-slate-400 ml-2 flex-shrink-0'>
									{percentage}% ({voteCount})
								</span>
							</div>
						</button>
					);
				})}
			</div>

			<p className='text-[11px] text-slate-500 mt-2'>
				{totalVotes} vote{totalVotes !== 1 ? "s" : ""}
			</p>
		</div>
	);
};

export default PollsList;
