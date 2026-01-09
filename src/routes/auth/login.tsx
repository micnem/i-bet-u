import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/auth/login")({ component: LoginPage });

function LoginPage() {
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		rememberMe: false,
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
		if (errors[name]) {
			setErrors((prev) => ({ ...prev, [name]: "" }));
		}
	};

	const validate = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.email.trim()) {
			newErrors.email = "Email is required";
		}

		if (!formData.password) {
			newErrors.password = "Password is required";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (validate()) {
			// Mock login - just navigate to dashboard
			navigate({ to: "/dashboard" });
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
						<p className="text-gray-600 mt-2">Sign in to continue betting</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Email */}
						<div>
							<label htmlFor="email" className="ibetu-label">
								Email or Username
							</label>
							<div className="relative">
								<Mail
									className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
									size={20}
								/>
								<input
									type="text"
									id="email"
									name="email"
									value={formData.email}
									onChange={handleChange}
									className={`ibetu-input pl-12 ${errors.email ? "border-red-500" : ""}`}
									placeholder="john@example.com"
								/>
							</div>
							{errors.email && (
								<p className="text-red-500 text-sm mt-1">{errors.email}</p>
							)}
						</div>

						{/* Password */}
						<div>
							<label htmlFor="password" className="ibetu-label">
								Password
							</label>
							<div className="relative">
								<Lock
									className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
									size={20}
								/>
								<input
									type={showPassword ? "text" : "password"}
									id="password"
									name="password"
									value={formData.password}
									onChange={handleChange}
									className={`ibetu-input pl-12 pr-10 ${errors.password ? "border-red-500" : ""}`}
									placeholder="••••••••"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
								>
									{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
								</button>
							</div>
							{errors.password && (
								<p className="text-red-500 text-sm mt-1">{errors.password}</p>
							)}
						</div>

						{/* Remember Me & Forgot Password */}
						<div className="flex items-center justify-between">
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									name="rememberMe"
									checked={formData.rememberMe}
									onChange={handleChange}
									className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
								/>
								<span className="text-sm text-gray-600">Remember me</span>
							</label>
							<button
								type="button"
								className="text-sm text-orange-500 hover:text-orange-600"
							>
								Forgot password?
							</button>
						</div>

						<button type="submit" className="w-full ibetu-btn-primary mt-6">
							Sign In
						</button>
					</form>

					{/* Demo Login */}
					<div className="mt-6 pt-6 border-t border-gray-200">
						<p className="text-center text-gray-500 text-sm mb-4">
							Demo Mode - Click to log in instantly
						</p>
						<button
							onClick={() => navigate({ to: "/dashboard" })}
							className="w-full ibetu-btn-secondary"
						>
							Continue as Demo User
						</button>
					</div>

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
