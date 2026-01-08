import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, User, Phone, ArrowLeft, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/auth/signup")({ component: SignUpPage });

function SignUpPage() {
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);
	const [formData, setFormData] = useState({
		displayName: "",
		username: "",
		email: "",
		phone: "",
		password: "",
		confirmPassword: "",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		// Clear error when user types
		if (errors[name]) {
			setErrors((prev) => ({ ...prev, [name]: "" }));
		}
	};

	const validate = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.displayName.trim()) {
			newErrors.displayName = "Display name is required";
		}

		if (!formData.username.trim()) {
			newErrors.username = "Username is required";
		} else if (formData.username.length < 3) {
			newErrors.username = "Username must be at least 3 characters";
		}

		if (!formData.email.trim()) {
			newErrors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = "Please enter a valid email";
		}

		if (!formData.password) {
			newErrors.password = "Password is required";
		} else if (formData.password.length < 6) {
			newErrors.password = "Password must be at least 6 characters";
		}

		if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = "Passwords do not match";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (validate()) {
			// Mock signup - just navigate to dashboard
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
						<h2 className="text-xl font-semibold text-gray-800">
							Create Your Account
						</h2>
						<p className="text-gray-600 mt-2">
							Join and start betting with friends
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Display Name */}
						<div>
							<label htmlFor="displayName" className="ibetu-label">
								Display Name
							</label>
							<div className="relative">
								<User
									className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
									size={20}
								/>
								<input
									type="text"
									id="displayName"
									name="displayName"
									value={formData.displayName}
									onChange={handleChange}
									className={`ibetu-input pl-10 ${errors.displayName ? "border-red-500" : ""}`}
									placeholder="John Doe"
								/>
							</div>
							{errors.displayName && (
								<p className="text-red-500 text-sm mt-1">{errors.displayName}</p>
							)}
						</div>

						{/* Username */}
						<div>
							<label htmlFor="username" className="ibetu-label">
								Username (Nickname)
							</label>
							<div className="relative">
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
									@
								</span>
								<input
									type="text"
									id="username"
									name="username"
									value={formData.username}
									onChange={handleChange}
									className={`ibetu-input pl-10 ${errors.username ? "border-red-500" : ""}`}
									placeholder="johndoe"
								/>
							</div>
							{errors.username && (
								<p className="text-red-500 text-sm mt-1">{errors.username}</p>
							)}
						</div>

						{/* Email */}
						<div>
							<label htmlFor="email" className="ibetu-label">
								Email
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
									className={`ibetu-input pl-10 ${errors.email ? "border-red-500" : ""}`}
									placeholder="john@example.com"
								/>
							</div>
							{errors.email && (
								<p className="text-red-500 text-sm mt-1">{errors.email}</p>
							)}
						</div>

						{/* Phone (Optional) */}
						<div>
							<label htmlFor="phone" className="ibetu-label">
								Phone Number{" "}
								<span className="text-gray-400 font-normal">(optional)</span>
							</label>
							<div className="relative">
								<Phone
									className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
									size={20}
								/>
								<input
									type="tel"
									id="phone"
									name="phone"
									value={formData.phone}
									onChange={handleChange}
									className="ibetu-input pl-10"
									placeholder="+1 555-123-4567"
								/>
							</div>
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
									className={`ibetu-input pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
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

						{/* Confirm Password */}
						<div>
							<label htmlFor="confirmPassword" className="ibetu-label">
								Confirm Password
							</label>
							<div className="relative">
								<Lock
									className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
									size={20}
								/>
								<input
									type={showPassword ? "text" : "password"}
									id="confirmPassword"
									name="confirmPassword"
									value={formData.confirmPassword}
									onChange={handleChange}
									className={`ibetu-input pl-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
									placeholder="••••••••"
								/>
							</div>
							{errors.confirmPassword && (
								<p className="text-red-500 text-sm mt-1">
									{errors.confirmPassword}
								</p>
							)}
						</div>

						<button type="submit" className="w-full ibetu-btn-primary mt-6">
							Create Account
						</button>
					</form>

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
