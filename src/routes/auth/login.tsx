import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useSignIn } from "@clerk/tanstack-react-start";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/login")({ component: LoginPage });

function LoginPage() {
	const navigate = useNavigate();
	const { signIn, setActive, isLoaded } = useSignIn();
	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [step, setStep] = useState<"email" | "code">("email");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSendCode = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isLoaded || !signIn) return;

		setIsLoading(true);
		setError("");

		try {
			// Start the sign-in process with email code
			const result = await signIn.create({
				identifier: email,
				strategy: "email_code",
			});

			if (result.status === "needs_first_factor") {
				// Prepare for email code verification
				const emailFactor = result.supportedFirstFactors?.find(
					(f) => f.strategy === "email_code"
				);
				if (emailFactor && "emailAddressId" in emailFactor) {
					await signIn.prepareFirstFactor({
						strategy: "email_code",
						emailAddressId: emailFactor.emailAddressId,
					});
				}
				setStep("code");
			}
		} catch (err: unknown) {
			const clerkError = err as { errors?: { message: string }[] };
			setError(
				clerkError.errors?.[0]?.message ||
					"Failed to send code. Please try again."
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleVerifyCode = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isLoaded || !signIn) return;

		setIsLoading(true);
		setError("");

		try {
			// Attempt to verify the code
			const result = await signIn.attemptFirstFactor({
				strategy: "email_code",
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
		if (!isLoaded || !signIn) return;

		setIsLoading(true);
		setError("");

		try {
			const emailFactor = signIn.supportedFirstFactors?.find(
				(f) => f.strategy === "email_code"
			);
			if (emailFactor && "emailAddressId" in emailFactor) {
				await signIn.prepareFirstFactor({
					strategy: "email_code",
					emailAddressId: emailFactor.emailAddressId,
				});
			}
			setError(""); // Clear any errors
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
						<h2 className="text-xl font-semibold text-gray-800">Welcome Back</h2>
						<p className="text-gray-600 mt-2">
							{step === "email"
								? "Enter your email to sign in"
								: "Enter the code sent to your email"}
						</p>
					</div>

					{error && (
						<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
							{error}
						</div>
					)}

					{step === "email" ? (
						<form onSubmit={handleSendCode} className="space-y-4">
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
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className="ibetu-input pl-10"
										placeholder="john@example.com"
										required
										disabled={isLoading}
									/>
								</div>
							</div>

							<button
								type="submit"
								disabled={isLoading || !email}
								className="w-full ibetu-btn-primary mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							>
								{isLoading ? (
									<>
										<Loader2 className="animate-spin" size={20} />
										Sending Code...
									</>
								) : (
									"Send Sign In Code"
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
									<span className="font-medium">{email}</span>
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
									"Verify & Sign In"
								)}
							</button>

							<div className="flex items-center justify-between text-sm">
								<button
									type="button"
									onClick={() => {
										setStep("email");
										setCode("");
										setError("");
									}}
									className="text-gray-600 hover:text-gray-900"
								>
									Change email
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
						Don't have an account?{" "}
						<Link
							to="/auth/signup"
							className="text-orange-500 hover:text-orange-600 font-medium"
						>
							Sign Up
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
