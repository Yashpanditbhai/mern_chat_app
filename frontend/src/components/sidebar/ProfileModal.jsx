import { useState, useRef } from "react";
import { IoClose, IoCamera } from "react-icons/io5";
import { useAuthContext } from "../../context/AuthContext";
import { getProfilePic } from "../../utils/avatar";
import toast from "react-hot-toast";

const ProfileModal = ({ isOpen, onClose }) => {
	const { authUser, setAuthUser } = useAuthContext();
	const [statusText, setStatusText] = useState(authUser?.statusText || "");
	const [selectedPhoto, setSelectedPhoto] = useState(null);
	const [photoPreview, setPhotoPreview] = useState(null);
	const [loading, setLoading] = useState(false);
	const photoInputRef = useRef(null);

	const handlePhotoSelect = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.size > 5 * 1024 * 1024) {
			toast.error("Photo must be under 5MB");
			return;
		}
		setSelectedPhoto(file);
		const reader = new FileReader();
		reader.onload = (e) => setPhotoPreview(e.target.result);
		reader.readAsDataURL(file);
	};

	const handleSave = async () => {
		setLoading(true);
		try {
			const formData = new FormData();
			formData.append("statusText", statusText);
			if (selectedPhoto) {
				formData.append("file", selectedPhoto);
			}

			const res = await fetch("/api/users/profile", {
				method: "PUT",
				body: formData,
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			// Update auth context with new data
			const updatedUser = { ...authUser, ...data, token: authUser.token };
			setAuthUser(updatedUser);
			localStorage.setItem("chat-user", JSON.stringify(updatedUser));

			toast.success("Profile updated");
			setSelectedPhoto(null);
			setPhotoPreview(null);
			onClose();
		} catch (error) {
			toast.error(error.message || "Failed to update profile");
		} finally {
			setLoading(false);
		}
	};

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

				<h3 className='text-lg font-semibold text-white mb-5'>Edit Profile</h3>

				{/* Profile Photo */}
				<div className='flex justify-center mb-5'>
					<div className='relative'>
						<div className='w-24 h-24 rounded-full overflow-hidden border-2 border-primary'>
							<img
								src={photoPreview || getProfilePic(authUser)}
								alt='profile'
								className='w-full h-full object-cover'
							/>
						</div>
						<button
							onClick={() => photoInputRef.current?.click()}
							className='absolute bottom-0 right-0 p-2 bg-primary hover:bg-blue-600 rounded-full text-white transition-colors'
						>
							<IoCamera className='w-4 h-4' />
						</button>
						<input
							ref={photoInputRef}
							type='file'
							accept='image/*'
							className='hidden'
							onChange={handlePhotoSelect}
						/>
					</div>
				</div>

				{/* Name (read-only) */}
				<div className='mb-4'>
					<label className='text-xs text-slate-400 mb-1 block'>Name</label>
					<p className='text-sm text-white'>{authUser?.fullName}</p>
				</div>

				{/* Username (read-only) */}
				<div className='mb-4'>
					<label className='text-xs text-slate-400 mb-1 block'>Username</label>
					<p className='text-sm text-slate-300'>@{authUser?.username}</p>
				</div>

				{/* Status Text */}
				<div className='mb-5'>
					<label className='text-xs text-slate-400 mb-1 block'>Status</label>
					<input
						type='text'
						value={statusText}
						onChange={(e) => setStatusText(e.target.value)}
						placeholder='What&apos;s on your mind?'
						maxLength={150}
						className='w-full px-3 py-2 rounded-lg bg-base-300 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors'
					/>
					<p className='text-xs text-slate-500 mt-1 text-right'>{statusText.length}/150</p>
				</div>

				{/* Save button */}
				<button
					onClick={handleSave}
					disabled={loading}
					className='w-full py-2.5 rounded-xl bg-primary hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50'
				>
					{loading ? (
						<span className='loading loading-spinner loading-sm'></span>
					) : (
						"Save"
					)}
				</button>
			</div>
		</div>
	);
};

export default ProfileModal;
