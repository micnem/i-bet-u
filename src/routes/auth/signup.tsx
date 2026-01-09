import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useSignUp } from "@clerk/tanstack-start";
import { Mail, User, ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/signup")({ component: SignUpPage });

function SignUpPage() {
	const navigate = useNavigate();
	const { signUp, setActive, isLoaded } = useSignUp();
	const [step, setStep] = useState<"info" | "code">("info");
	const [formData, setFormData] = useState({
		email: "",
		firstName: "",
		lastName: "",
		username: "",
	});
	const [code, setCode] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		setError("");
	};

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isLoaded || !signUp) return;

		setIsLoading(true);
		setError("");

		try {
			// Create the sign-up with email verification
			await signUp.create({
				emailAddress: formData.email,
				firstName: formData.firstName,
				lastName: formData.lastName,
				username: formData.username || undefined,
			});

			// Prepare email verification
			await signUp.prepareEmailAddressVerification({
				strategy: "email_code",
			});

			setStep("code");
		} catch (err: unknown) {
			const clerkError = err as { errors?: { message: string }[] };
			setError(
				clerkError.errors?.[0]?.message ||
					"Failed to create account. Please try again."
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleVerifyCode = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isLoaded || !signUp) return;

		setIsLoading(true);
		setError("");

		try {
			// Attempt to verify the email code
			const result = await signUp.attemptEmailAddressVerification({
				code,
			});

			if (result.status === "complete") {
				// Set the session active and redirect
				await setActive({ session: result.createdSessionId });
				navigate({ to: "/dashboard" });
			}
		} catch (err: unknown) {
			const clerkError = err as { errors?: { message: string }[] };
			setError(
				clerkError.errors?.[0]?.message || "Invalid code. Please try again."
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleResendCode = async () => {
		if (!isLoaded || !signUp) return;

		setIsLoading(true);
		setError("");

		try {
			await signUp.prepareEmailAddressVerification({
				strategy: "email_code",
			});
		} catch (err: unknown) {
			const clerkError = err as { errors?: { message: string }[] };
			setError(clerkError.errors?.[0]?.message || "Failed to resend code.");
		} finally {
			setIsLoading(false);
		}
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
						<h1 className="text-3xl font-bold text-orange-500 mb-2">IBetU</h1>
						<h2 className="text-xl font-semibold text-gray-800">
							{step === "info" ? "Create Your Account" : "Verify Your Email"}
						</h2>
						<p className="text-gray-600 mt-2">
							{step === "info"
								? "Join and start betting with friends"
								: "Enter the code sent to your email"}
						</p>
					</div>

					{error && (
						<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
							{error}
						</div>
					)}

					{step === "info" ? (
						<form onSubmit={handleSignUp} className="space-y-4">
							{/* Email */}
							<div>
								<label htmlFor="email" className="ibetu-label">
									Email Address
								</label>
								<div className="relative">
									<Mail
										className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
										size={20}
									/>
									<input
										type="email"
										id="email"
										name="email"
										value={formData.email}
										onChange={handleChange}
										className="ibetu-input pl-10"
										placeholder="john@example.com"
										required
										disabled={isLoading}
									/>
								</div>
							</div>

							{/* Name Fields */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label htmlFor="firstName" className="ibetu-label">
										First Name
									</label>
									<input
										type="text"
										id="firstName"
										name="firstName"
										value={formData.firstName}
										onChange={handleChange}
										className="ibetu-input"
										placeholder="John"
										required
										disabled={isLoading}
									/>
								</div>
								<div>
									<label htmlFor="lastName" className="ibetu-label">
										Last Name
									</label>
									<input
										type="text"
										id="lastName"
										name="lastName"
										value={formData.lastName}
										onChange={handleChange}
										className="ibetu-input"
										placeholder="Doe"
										required
										disabled={isLoading}
									/>
								</div>
							</div>

							{/* Username */}
							<div>
								<label htmlFor="username" className="ibetu-label">
									Username{" "}
									<span className="text-gray-400 font-normal">(optional)</span>
								</label>
								<div className="relative">
									<User
										className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
										size={20}
									/>
									<input
										type="text"
										id="username"
										name="username"
										value={formData.username}
										onChange={handleChange}
										className="ibetu-input pl-10"
										placeholder="johndoe"
										disabled={isLoading}
									/>
								</div>
								<p className="text-xs text-gray-500 mt-1">
									Your friends will find you by this name
								</p>
							</div>

							<button
								type="submit"
								disabled={isLoading || !formData.email || !formData.firstName}
								className="w-full ibetu-btn-primary mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							>
								{isLoading ? (
									<>
										<Loader2 className="animate-spin" size={20} />
										Creating Account...
									</>
								) : (
									"Create Account"
								)}
							</button>
						</form>
					) : (
						<form onSubmit={handleVerifyCode} className="space-y-4">
							<div>
								<label htmlFor="code" className="ibetu-label">
									Verification Code
								</label>
								<input
									type="text"
									id="code"
									value={code}
									onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
									className="ibetu-input text-center text-2xl tracking-widest"
									placeholder="000000"
									maxLength={6}
									required
									disabled={isLoading}
									autoFocus
								/>
								<p className="text-sm text-gray-500 mt-2">
									We sent a 6-digit code to{" "}
									<span className="font-medium">{formData.email}</span>
								</p>
							</div>

							<button
								type="submit"
								disabled={isLoading || code.length !== 6}
								className="w-full ibetu-btn-primary mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							>
								{isLoading ? (
									<>
										<Loader2 className="animate-spin" size={20} />
										Verifying...
									</>
								) : (
									"Verify & Continue"
								)}
							</button>

							<div className="flex items-center justify-between text-sm">
								<button
									type="button"
									onClick={() => {
										setStep("info");
										setCode("");
										setError("");
									}}
									className="text-gray-600 hover:text-gray-900"
								>
									Back to signup
								</button>
								<button
									type="button"
									onClick={handleResendCode}
									disabled={isLoading}
									className="text-orange-500 hover:text-orange-600 disabled:opacity-50"
								>
									Resend code
								</button>
							</div>
						</form>
					)}

					<p className="text-center text-gray-600 mt-6">
						Already have an account?{" "}
						<Link
							to="/auth/login"
							className="text-orange-500 hover:text-orange-600 font-medium"
						>
							Sign In
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
