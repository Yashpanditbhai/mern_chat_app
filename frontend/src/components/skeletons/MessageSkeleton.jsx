const MessageSkeleton = () => {
	return (
		<div className='space-y-4 py-2'>
			<div className='flex items-end gap-2'>
				<div className='w-8 h-8 rounded-full bg-base-300 animate-pulse flex-shrink-0' />
				<div className='space-y-1.5'>
					<div className='h-10 w-52 rounded-2xl rounded-bl-md bg-base-300 animate-pulse' />
					<div className='h-3 w-16 rounded bg-base-300 animate-pulse' />
				</div>
			</div>
			<div className='flex items-end gap-2 flex-row-reverse'>
				<div className='w-8 h-8 rounded-full bg-base-300 animate-pulse flex-shrink-0' />
				<div className='space-y-1.5 flex flex-col items-end'>
					<div className='h-10 w-40 rounded-2xl rounded-br-md bg-base-300 animate-pulse' />
					<div className='h-3 w-16 rounded bg-base-300 animate-pulse' />
				</div>
			</div>
		</div>
	);
};

export default MessageSkeleton;
