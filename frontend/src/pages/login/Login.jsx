import { useState } from "react";
import { Link } from "react-router-dom";
import useLogin from "../../hooks/useLogin";
import { BsChatDotsFill } from "react-icons/bs";
import { useLanguage } from "../../context/LanguageContext";

const Login = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const { loading, login } = useLogin();
	const { t } = useLanguage();

	const handleSubmit = async (e) => {
		e.preventDefault();
		await login(username, password);
	};

	return (
		<div className='h-full flex items-center justify-center bg-base-100 px-4'>
			<div className='w-full max-w-md'>
				<div className='text-center mb-8'>
					<div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4'>
						<BsChatDotsFill className='w-8 h-8 text-primary' />
					</div>
					<h1 className='text-3xl font-bold text-white'>{t("welcomeBack")}</h1>
					<p className='text-slate-400 mt-2'>{t("signInTo")}</p>
				</div>

				<div className='bg-base-200 rounded-2xl p-8 shadow-xl border border-base-300'>
					<form onSubmit={handleSubmit} className='space-y-5'>
						<div>
							<label className='block text-sm font-medium text-slate-300 mb-2'>
								{t("username")}
							</label>
							<input
								type='text'
								placeholder={t("enterUsername")}
								className='w-full px-4 py-3 rounded-xl bg-base-300 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors'
								value={username}
								onChange={(e) => setUsername(e.target.value)}
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-slate-300 mb-2'>
								{t("password")}
							</label>
							<input
								type='password'
								placeholder={t("enterPassword")}
								className='w-full px-4 py-3 rounded-xl bg-base-300 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors'
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>

						<button
							type='submit'
							className='w-full py-3 rounded-xl bg-primary hover:bg-blue-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
							disabled={loading}
						>
							{loading ? (
								<span className='loading loading-spinner loading-sm'></span>
							) : (
								t("signIn")
							)}
						</button>
					</form>

					<p className='text-center text-slate-400 text-sm mt-6'>
						{t("dontHaveAccount")}{" "}
						<Link to='/signup' className='text-primary hover:text-blue-400 font-medium'>
							{t("createOne")}
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
};

export default Login;
