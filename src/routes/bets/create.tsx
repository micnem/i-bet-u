import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
	ArrowLeft,
	Users,
	DollarSign,
	Calendar,
	Shield,
	Send,
	Check,
} from "lucide-react";
import { currentUser, mockFriends } from "../../data/mockData";
import type { VerificationMethod } from "../../data/types";

export const Route = createFileRoute("/bets/create")({
	component: CreateBetPage,
	validateSearch: (search: Record<string, unknown>) => ({
		friendId: search.friendId as string | undefined,
	}),
});

function CreateBetPage() {
	const navigate = useNavigate();
	const { friendId } = Route.useSearch();

	const [step, setStep] = useState(1);
	const [formData, setFormData] = useState({
		opponentId: friendId || "",
		title: "",
		description: "",
		amount: "",
		deadline: "",
		verificationMethod: "mutual_agreement" as VerificationMethod,
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		if (errors[name]) {
			setErrors((prev) => ({ ...prev, [name]: "" }));
		}
	};

	const validateStep = (stepNum: number) => {
		const newErrors: Record<string, string> = {};

		if (stepNum === 1) {
			if (!formData.opponentId) {
				newErrors.opponentId = "Please select a friend to bet with";
			}
		}

		if (stepNum === 2) {
			if (!formData.title.trim()) {
				newErrors.title = "Bet title is required";
			}
			if (!formData.description.trim()) {
				newErrors.description = "Please describe what you're betting on";
			}
		}

		if (stepNum === 3) {
			if (!formData.amount || parseFloat(formData.amount) <= 0) {
				newErrors.amount = "Please enter a valid amount";
			} else if (parseFloat(formData.amount) > currentUser.walletBalance) {
				newErrors.amount = "Insufficient wallet balance";
			}
			if (!formData.deadline) {
				newErrors.deadline = "Please set a deadline";
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const nextStep = () => {
		if (validateStep(step)) {
			setStep(step + 1);
		}
	};

	const prevStep = () => {
		setStep(step - 1);
	};

	const handleSubmit = () => {
		if (validateStep(3)) {
			// Mock submission - in real app, would save to backend
			navigate({ to: "/dashboard" });
		}
	};

	const selectedFriend = mockFriends.find(
		(f) => f.user.id === formData.opponentId
	);

	const verificationOptions: {
		value: VerificationMethod;
		label: string;
		description: string;
	}[] = [
		{
			value: "mutual_agreement",
			label: "Mutual Agreement",
			description: "Both parties agree on the winner",
		},
		{
			value: "third_party",
			label: "Third Party",
			description: "A neutral friend verifies the outcome",
		},
		{
			value: "photo_proof",
			label: "Photo Proof",
			description: "Winner provides photo evidence",
		},
		{
			value: "honor_system",
			label: "Honor System",
			description: "Trust each other to be honest",
		},
	];

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header */}
			<div className="bg-white shadow">
				<div className="max-w-2xl mx-auto px-6 py-4">
					<Link
						to="/dashboard"
						className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
					>
						<ArrowLeft size={20} />
						Back
					</Link>
					<h1 className="text-2xl font-bold text-gray-800">Create New Bet</h1>

					{/* Progress Steps */}
					<div className="flex items-center gap-2 mt-6">
						{[1, 2, 3, 4].map((s) => (
							<div key={s} className="flex items-center flex-1">
								<div
									className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
										s < step
											? "bg-green-500 text-white"
											: s === step
												? "bg-orange-500 text-white"
												: "bg-gray-200 text-gray-500"
									}`}
								>
									{s < step ? <Check size={16} /> : s}
								</div>
								{s < 4 && (
									<div
										className={`flex-1 h-1 mx-2 ${
											s < step ? "bg-green-500" : "bg-gray-200"
										}`}
									/>
								)}
							</div>
						))}
					</div>
					<div className="flex justify-between mt-2 text-xs text-gray-500">
						<span>Opponent</span>
						<span>Details</span>
						<span>Terms</span>
						<span>Review</span>
					</div>
				</div>
			</div>

			<div className="max-w-2xl mx-auto px-6 py-8">
				<div className="bg-white rounded-xl shadow-md p-6">
					{/* Step 1: Select Opponent */}
					{step === 1 && (
						<div>
							<div className="flex items-center gap-3 mb-6">
								<div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
									<Users className="w-5 h-5 text-orange-500" />
								</div>
								<div>
									<h2 className="text-lg font-semibold">Select Opponent</h2>
									<p className="text-sm text-gray-500">
										Choose a friend to bet against
									</p>
								</div>
							</div>

							<div className="space-y-3">
								{mockFriends.map((friend) => (
									<button
										key={friend.id}
										onClick={() =>
											setFormData((prev) => ({
												...prev,
												opponentId: friend.user.id,
											}))
										}
										className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-colors ${
											formData.opponentId === friend.user.id
												? "border-orange-500 bg-orange-50"
												: "border-gray-200 hover:border-gray-300"
										}`}
									>
										<img
											src={friend.user.avatar}
											alt={friend.user.displayName}
											className="w-12 h-12 rounded-full bg-gray-200"
										/>
										<div className="flex-1 text-left">
											<p className="font-medium text-gray-800">
												{friend.user.displayName}
											</p>
											<p className="text-sm text-gray-500">
												@{friend.user.username} • Win rate:{" "}
												{friend.user.stats.winRate}%
											</p>
										</div>
										{formData.opponentId === friend.user.id && (
											<Check className="w-5 h-5 text-orange-500" />
										)}
									</button>
								))}
							</div>

							{errors.opponentId && (
								<p className="text-red-500 text-sm mt-3">{errors.opponentId}</p>
							)}
						</div>
					)}

					{/* Step 2: Bet Details */}
					{step === 2 && (
						<div>
							<div className="flex items-center gap-3 mb-6">
								<div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
									<Send className="w-5 h-5 text-orange-500" />
								</div>
								<div>
									<h2 className="text-lg font-semibold">Bet Details</h2>
									<p className="text-sm text-gray-500">
										What are you betting on?
									</p>
								</div>
							</div>

							<div className="space-y-4">
								<div>
									<label htmlFor="title" className="ibetu-label">
										Bet Title
									</label>
									<input
										type="text"
										id="title"
										name="title"
										value={formData.title}
										onChange={handleChange}
										className={`ibetu-input ${errors.title ? "border-red-500" : ""}`}
										placeholder="e.g., Lakers win tonight"
									/>
									{errors.title && (
										<p className="text-red-500 text-sm mt-1">{errors.title}</p>
									)}
								</div>

								<div>
									<label htmlFor="description" className="ibetu-label">
										Description
									</label>
									<textarea
										id="description"
										name="description"
										value={formData.description}
										onChange={handleChange}
										rows={4}
										className={`ibetu-input resize-none ${errors.description ? "border-red-500" : ""}`}
										placeholder="Describe the bet in detail. What exactly needs to happen for you to win?"
									/>
									{errors.description && (
										<p className="text-red-500 text-sm mt-1">
											{errors.description}
										</p>
									)}
								</div>
							</div>
						</div>
					)}

					{/* Step 3: Terms */}
					{step === 3 && (
						<div>
							<div className="flex items-center gap-3 mb-6">
								<div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
									<DollarSign className="w-5 h-5 text-orange-500" />
								</div>
								<div>
									<h2 className="text-lg font-semibold">Set Terms</h2>
									<p className="text-sm text-gray-500">
										Define amount, deadline, and verification
									</p>
								</div>
							</div>

							<div className="space-y-4">
								<div>
									<label htmlFor="amount" className="ibetu-label">
										Bet Amount
									</label>
									<div className="relative">
										<DollarSign
											className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
											size={20}
										/>
										<input
											type="number"
											id="amount"
											name="amount"
											value={formData.amount}
											onChange={handleChange}
											min="1"
											step="1"
											className={`ibetu-input pl-10 ${errors.amount ? "border-red-500" : ""}`}
											placeholder="50"
										/>
									</div>
									<p className="text-sm text-gray-500 mt-1">
										Your wallet balance: ${currentUser.walletBalance.toFixed(2)}
									</p>
									{errors.amount && (
										<p className="text-red-500 text-sm mt-1">{errors.amount}</p>
									)}
								</div>

								<div>
									<label htmlFor="deadline" className="ibetu-label">
										Deadline
									</label>
									<div className="relative">
										<Calendar
											className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
											size={20}
										/>
										<input
											type="datetime-local"
											id="deadline"
											name="deadline"
											value={formData.deadline}
											onChange={handleChange}
											min={new Date().toISOString().slice(0, 16)}
											className={`ibetu-input pl-10 ${errors.deadline ? "border-red-500" : ""}`}
										/>
									</div>
									{errors.deadline && (
										<p className="text-red-500 text-sm mt-1">
											{errors.deadline}
										</p>
									)}
								</div>

								<div>
									<label className="ibetu-label flex items-center gap-2">
										<Shield size={16} />
										Verification Method
									</label>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
										{verificationOptions.map((option) => (
											<button
												key={option.value}
												type="button"
												onClick={() =>
													setFormData((prev) => ({
														...prev,
														verificationMethod: option.value,
													}))
												}
												className={`p-4 rounded-lg border-2 text-left transition-colors ${
													formData.verificationMethod === option.value
														? "border-orange-500 bg-orange-50"
														: "border-gray-200 hover:border-gray-300"
												}`}
											>
												<p className="font-medium text-gray-800">
													{option.label}
												</p>
												<p className="text-sm text-gray-500">
													{option.description}
												</p>
											</button>
										))}
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Step 4: Review */}
					{step === 4 && (
						<div>
							<div className="flex items-center gap-3 mb-6">
								<div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
									<Check className="w-5 h-5 text-green-500" />
								</div>
								<div>
									<h2 className="text-lg font-semibold">Review & Send</h2>
									<p className="text-sm text-gray-500">
										Confirm your bet details
									</p>
								</div>
							</div>

							<div className="space-y-4">
								<div className="bg-gray-50 rounded-lg p-4">
									<p className="text-sm text-gray-500 mb-1">Betting against</p>
									<div className="flex items-center gap-3">
										<img
											src={selectedFriend?.user.avatar}
											alt={selectedFriend?.user.displayName}
											className="w-10 h-10 rounded-full bg-gray-200"
										/>
										<div>
											<p className="font-medium">
												{selectedFriend?.user.displayName}
											</p>
											<p className="text-sm text-gray-500">
												@{selectedFriend?.user.username}
											</p>
										</div>
									</div>
								</div>

								<div className="bg-gray-50 rounded-lg p-4">
									<p className="text-sm text-gray-500 mb-1">Bet</p>
									<p className="font-semibold text-lg">{formData.title}</p>
									<p className="text-gray-600 mt-1">{formData.description}</p>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="bg-gray-50 rounded-lg p-4">
										<p className="text-sm text-gray-500 mb-1">Amount</p>
										<p className="font-bold text-2xl text-orange-500">
											${formData.amount}
										</p>
									</div>
									<div className="bg-gray-50 rounded-lg p-4">
										<p className="text-sm text-gray-500 mb-1">Deadline</p>
										<p className="font-medium">
											{formData.deadline
												? new Date(formData.deadline).toLocaleDateString(
														"en-US",
														{
															month: "short",
															day: "numeric",
															year: "numeric",
															hour: "2-digit",
															minute: "2-digit",
														}
													)
												: "-"}
										</p>
									</div>
								</div>

								<div className="bg-gray-50 rounded-lg p-4">
									<p className="text-sm text-gray-500 mb-1">Verification</p>
									<p className="font-medium capitalize">
										{formData.verificationMethod.replace("_", " ")}
									</p>
								</div>

								<div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
									<p className="text-sm text-orange-800">
										<strong>Note:</strong> ${formData.amount} will be held from
										your wallet when your friend accepts this bet. The total pot
										of ${parseFloat(formData.amount || "0") * 2} will go to the
										winner.
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Navigation Buttons */}
					<div className="flex gap-3 mt-8">
						{step > 1 && (
							<button
								onClick={prevStep}
								className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
							>
								Back
							</button>
						)}
						{step < 4 ? (
							<button
								onClick={nextStep}
								className="flex-1 ibetu-btn-primary"
							>
								Continue
							</button>
						) : (
							<button
								onClick={handleSubmit}
								className="flex-1 ibetu-btn-primary inline-flex items-center justify-center gap-2"
							>
								<Send size={20} />
								Send Bet Invite
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
