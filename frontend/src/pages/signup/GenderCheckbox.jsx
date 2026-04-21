const GenderCheckbox = ({ onCheckboxChange, selectedGender }) => {
	return (
		<div>
			<label className='block text-sm font-medium text-slate-300 mb-2'>Gender</label>
			<div className='flex gap-4'>
				<label
					className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border cursor-pointer transition-all ${
						selectedGender === "male"
							? "border-primary bg-primary/10 text-primary"
							: "border-slate-600 bg-base-300 text-slate-400 hover:border-slate-500"
					}`}
				>
					<input
						type='radio'
						name='gender'
						className='hidden'
						checked={selectedGender === "male"}
						onChange={() => onCheckboxChange("male")}
					/>
					<span className='text-lg'>&#9794;</span>
					<span className='text-sm font-medium'>Male</span>
				</label>
				<label
					className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border cursor-pointer transition-all ${
						selectedGender === "female"
							? "border-pink-500 bg-pink-500/10 text-pink-500"
							: "border-slate-600 bg-base-300 text-slate-400 hover:border-slate-500"
					}`}
				>
					<input
						type='radio'
						name='gender'
						className='hidden'
						checked={selectedGender === "female"}
						onChange={() => onCheckboxChange("female")}
					/>
					<span className='text-lg'>&#9792;</span>
					<span className='text-sm font-medium'>Female</span>
				</label>
			</div>
		</div>
	);
};

export default GenderCheckbox;
