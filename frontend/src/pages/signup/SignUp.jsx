import { Link } from "react-router-dom";
import GenderCheckbox from "./GenderCheckbox";
import { useState } from "react";
import useSignup from "../../hooks/useSignup";
import { BsChatDotsFill } from "react-icons/bs";
import { useLanguage } from "../../context/LanguageContext";

const SignUp = () => {
	const [inputs, setInputs] = useState({
		fullName: "",
		username: "",
		password: "",
		confirmPassword: "",
		gender: "",
	});

	const { loading, signup } = useSignup();
	const { t } = useLanguage();

	const handleCheckboxChange = (gender) => {
		setInputs({ ...inputs, gender });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		await signup(inputs);
	};

	return (
		<div className='h-full flex items-center justify-center bg-base-100 px-4'>
			<div className='w-full max-w-md'>
				<div className='text-center mb-8'>
					<div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4'>
						<BsChatDotsFill className='w-8 h-8 text-primary' />
					</div>
					<h1 className='text-3xl font-bold text-white'>{t("createAccount")}</h1>
					<p className='text-slate-400 mt-2'>{t("joinFlashChat")}</p>
				</div>

				<div className='bg-base-200 rounded-2xl p-8 shadow-xl border border-base-300'>
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div>
							<label className='block text-sm font-medium text-slate-300 mb-2'>
								{t("fullName")}
							</label>
							<input
								type='text'
								placeholder='John Doe'
								className='w-full px-4 py-3 rounded-xl bg-base-300 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors'
								value={inputs.fullName}
								onChange={(e) => setInputs({ ...inputs, fullName: e.target.value })}
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-slate-300 mb-2'>
								{t("username")}
							</label>
							<input
								type='text'
								placeholder='johndoe'
								className='w-full px-4 py-3 rounded-xl bg-base-300 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors'
								value={inputs.username}
								onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-slate-300 mb-2'>
								{t("password")}
							</label>
							<input
								type='password'
								placeholder={t("minChars")}
								className='w-full px-4 py-3 rounded-xl bg-base-300 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors'
								value={inputs.password}
								onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-slate-300 mb-2'>
								{t("confirmPassword")}
							</label>
							<input
								type='password'
								placeholder={t("confirmPwd")}
								className='w-full px-4 py-3 rounded-xl bg-base-300 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors'
								value={inputs.confirmPassword}
								onChange={(e) => setInputs({ ...inputs, confirmPassword: e.target.value })}
							/>
						</div>

						<GenderCheckbox onCheckboxChange={handleCheckboxChange} selectedGender={inputs.gender} />

						<button
							type='submit'
							className='w-full py-3 rounded-xl bg-primary hover:bg-blue-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
							disabled={loading}
						>
							{loading ? (
								<span className='loading loading-spinner loading-sm'></span>
							) : (
								t("signUp")
							)}
						</button>
					</form>

					<p className='text-center text-slate-400 text-sm mt-6'>
						{t("alreadyHaveAccount")}{" "}
						<Link to='/login' className='text-primary hover:text-blue-400 font-medium'>
							{t("signInLink")}
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
};

export default SignUp;
