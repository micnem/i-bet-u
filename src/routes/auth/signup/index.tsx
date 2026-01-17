import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Mail, Loader2, KeyRound } from "lucide-react";
import { getSupabaseBrowserClient } from "../../../lib/supabase-browser";
import { isValidEmail, isValidOtp } from "../../../lib/validation";
import { useUser } from "../../../components/AuthProvider";

type SignUpSearch = {
	redirect_url?: string;
};

export const Route = createFileRoute("/auth/signup/")({
	component: SignUpPage,
	validateSearch: (search: Record<string, unknown>): SignUpSearch => {
		return {
			redirect_url:
				typeof search.redirect_url === "string" ? search.redirect_url : undefined,
		};
	},
});

function SignUpPage() {
	const { redirect_url } = Route.useSearch();
	const navigate = useNavigate();
	const { isSignedIn, isLoaded } = useUser();

	const [step, setStep] = useState<"email" | "otp">("email");
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const redirectUrl = redirect_url || "/dashboard";

	// Redirect if already signed in
	useEffect(() => {
		if (isLoaded && isSignedIn) {
			navigate({ to: redirectUrl });
		}
	}, [isLoaded, isSignedIn, navigate, redirectUrl]);

	const handleSendOtp = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		const trimmedEmail = email.trim().toLowerCase();

		if (!isValidEmail(trimmedEmail)) {
			setError("Please enter a valid email address");
			setIsLoading(false);
			return;
		}

		const supabase = getSupabaseBrowserClient();
		const { error } = await supabase.auth.signInWithOtp({
			email: trimmedEmail,
			options: {
				shouldCreateUser: true,
			},
		});

		setIsLoading(false);

		if (error) {
			setError(error.message);
			return;
		}

		setStep("otp");
	};

	const handleVerifyOtp = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		const trimmedOtp = otp.trim();

		if (!isValidOtp(trimmedOtp)) {
			setError("Please enter a valid 6-digit code");
			setIsLoading(false);
			return;
		}

		const supabase = getSupabaseBrowserClient();
		const { error } = await supabase.auth.verifyOtp({
			email: email.trim().toLowerCase(),
			token: trimmedOtp,
			type: "email",
		});

		setIsLoading(false);

		if (error) {
			setError(error.message);
			return;
		}

		navigate({ to: redirectUrl });
	};

	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4">
			<div className="max-w-md mx-auto">
				<Link
					to="/"
					className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
				>
					<ArrowLeft size={20} />
					Back to Home
				</Link>

				<div className="bg-white rounded-xl shadow-lg p-8">
					<div className="text-center mb-8">
						<h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
						<p className="text-gray-600 mt-2">
							{step === "email"
								? "Enter your email to get started"
								: `Enter the code sent to ${email}`}
						</p>
					</div>

					{step === "email" ? (
						<form onSubmit={handleSendOtp} className="space-y-6">
							<div>
								<label
									htmlFor="email"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									Email address
								</label>
								<div className="relative">
									<Mail
										className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
										size={20}
									/>
									<input
										id="email"
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										placeholder="you@example.com"
										className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
										required
										autoFocus
									/>
								</div>
							</div>

							{error && (
								<div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
									{error}
								</div>
							)}

							<button
								type="submit"
								disabled={isLoading}
								className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
							>
								{isLoading ? (
									<>
										<Loader2 className="animate-spin" size={20} />
										Sending code...
									</>
								) : (
									"Continue with Email"
								)}
							</button>
						</form>
					) : (
						<form onSubmit={handleVerifyOtp} className="space-y-6">
							<div>
								<label
									htmlFor="otp"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									Verification code
								</label>
								<div className="relative">
									<KeyRound
										className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
										size={20}
									/>
									<input
										id="otp"
										type="text"
										inputMode="numeric"
										pattern="[0-9]*"
										maxLength={6}
										value={otp}
										onChange={(e) =>
											setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
										}
										placeholder="123456"
										className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors text-center text-2xl tracking-widest font-mono"
										required
										autoFocus
									/>
								</div>
							</div>

							{error && (
								<div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
									{error}
								</div>
							)}

							<button
								type="submit"
								disabled={isLoading}
								className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
							>
								{isLoading ? (
									<>
										<Loader2 className="animate-spin" size={20} />
										Verifying...
									</>
								) : (
									"Verify & Create Account"
								)}
							</button>

							<button
								type="button"
								onClick={() => {
									setStep("email");
									setOtp("");
									setError(null);
								}}
								className="w-full py-2 text-gray-600 hover:text-gray-900 text-sm transition-colors"
							>
								Use a different email
							</button>
						</form>
					)}

					<div className="mt-8 pt-6 border-t border-gray-200 text-center">
						<p className="text-gray-600">
							Already have an account?{" "}
							<Link
								to="/auth/login"
								search={redirect_url ? { redirect_url } : undefined}
								className="text-orange-500 hover:text-orange-600 font-medium"
							>
								Sign in
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
