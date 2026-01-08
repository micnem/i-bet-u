import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
	User,
	Wallet,
	CreditCard,
	Plus,
	Minus,
	Trophy,
	TrendingUp,
	Settings,
	LogOut,
	ChevronRight,
	X,
	Check,
	Eye,
	EyeOff,
} from "lucide-react";
import {
	currentUser,
	mockPaymentMethods,
	mockTransactions,
} from "../data/mockData";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
	const navigate = useNavigate();
	const [showAddFundsModal, setShowAddFundsModal] = useState(false);
	const [showWithdrawModal, setShowWithdrawModal] = useState(false);
	const [showAddCardModal, setShowAddCardModal] = useState(false);
	const [amount, setAmount] = useState("");
	const [selectedCard, setSelectedCard] = useState(
		mockPaymentMethods.find((p) => p.isDefault)?.id || ""
	);
	const [cardForm, setCardForm] = useState({
		number: "",
		expiry: "",
		cvv: "",
		name: "",
	});
	const [showCvv, setShowCvv] = useState(false);

	const user = currentUser;

	const handleAddFunds = () => {
		// Mock add funds
		setShowAddFundsModal(false);
		setAmount("");
	};

	const handleWithdraw = () => {
		// Mock withdrawal
		setShowWithdrawModal(false);
		setAmount("");
	};

	const handleAddCard = () => {
		// Mock add card
		setShowAddCardModal(false);
		setCardForm({ number: "", expiry: "", cvv: "", name: "" });
	};

	const handleLogout = () => {
		navigate({ to: "/" });
	};

	const quickAmounts = [25, 50, 100, 250];

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header */}
			<div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-8 px-6">
				<div className="max-w-4xl mx-auto">
					<div className="flex items-center gap-4">
						<img
							src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
							alt={user.displayName}
							className="w-20 h-20 rounded-full bg-white/20"
						/>
						<div>
							<h1 className="text-2xl font-bold">{user.displayName}</h1>
							<p className="text-orange-100">@{user.username}</p>
							<p className="text-orange-100 text-sm">{user.email}</p>
						</div>
					</div>

					{/* Stats */}
					<div className="grid grid-cols-4 gap-4 mt-8">
						<div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center">
							<p className="text-3xl font-bold">{user.stats.totalBets}</p>
							<p className="text-sm text-orange-100">Total Bets</p>
						</div>
						<div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center">
							<p className="text-3xl font-bold">{user.stats.won}</p>
							<p className="text-sm text-orange-100">Won</p>
						</div>
						<div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center">
							<p className="text-3xl font-bold">{user.stats.lost}</p>
							<p className="text-sm text-orange-100">Lost</p>
						</div>
						<div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center">
							<p className="text-3xl font-bold">{user.stats.winRate}%</p>
							<p className="text-sm text-orange-100">Win Rate</p>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-4xl mx-auto px-6 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Wallet Section */}
					<div className="bg-white rounded-xl shadow-md p-6">
						<div className="flex items-center gap-3 mb-6">
							<div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
								<Wallet className="w-5 h-5 text-orange-500" />
							</div>
							<div>
								<h2 className="text-lg font-semibold">Wallet</h2>
								<p className="text-sm text-gray-500">Manage your funds</p>
							</div>
						</div>

						<div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white mb-6">
							<p className="text-sm text-gray-400">Available Balance</p>
							<p className="text-4xl font-bold mt-1">
								${user.walletBalance.toFixed(2)}
							</p>
						</div>

						<div className="flex gap-3">
							<button
								onClick={() => setShowAddFundsModal(true)}
								className="flex-1 ibetu-btn-primary flex items-center justify-center gap-2"
							>
								<Plus size={20} />
								Add Funds
							</button>
							<button
								onClick={() => setShowWithdrawModal(true)}
								className="flex-1 ibetu-btn-secondary flex items-center justify-center gap-2"
							>
								<Minus size={20} />
								Withdraw
							</button>
						</div>
					</div>

					{/* Payment Methods */}
					<div className="bg-white rounded-xl shadow-md p-6">
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
									<CreditCard className="w-5 h-5 text-blue-500" />
								</div>
								<div>
									<h2 className="text-lg font-semibold">Payment Methods</h2>
									<p className="text-sm text-gray-500">Your saved cards</p>
								</div>
							</div>
						</div>

						<div className="space-y-3">
							{mockPaymentMethods.map((method) => (
								<div
									key={method.id}
									className={`flex items-center justify-between p-4 rounded-lg border-2 ${
										method.isDefault
											? "border-orange-500 bg-orange-50"
											: "border-gray-200"
									}`}
								>
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
											<CreditCard className="w-5 h-5 text-white" />
										</div>
										<div>
											<p className="font-medium text-gray-800">
												{method.brand} •••• {method.last4}
											</p>
											<p className="text-sm text-gray-500">
												Expires {method.expiryMonth}/{method.expiryYear}
											</p>
										</div>
									</div>
									{method.isDefault && (
										<span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
											Default
										</span>
									)}
								</div>
							))}
						</div>

						<button
							onClick={() => setShowAddCardModal(true)}
							className="w-full mt-4 px-4 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg font-medium hover:border-orange-500 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
						>
							<Plus size={20} />
							Add New Card
						</button>
					</div>

					{/* Transaction History */}
					<div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
						<div className="flex items-center gap-3 mb-6">
							<div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
								<TrendingUp className="w-5 h-5 text-green-500" />
							</div>
							<div>
								<h2 className="text-lg font-semibold">Transaction History</h2>
								<p className="text-sm text-gray-500">
									Recent wallet activity
								</p>
							</div>
						</div>

						<div className="space-y-3">
							{mockTransactions.map((txn) => (
								<div
									key={txn.id}
									className="flex items-center justify-between py-3 border-b last:border-0"
								>
									<div className="flex items-center gap-3">
										<div
											className={`w-10 h-10 rounded-full flex items-center justify-center ${
												txn.amount > 0
													? "bg-green-100"
													: "bg-red-100"
											}`}
										>
											{txn.amount > 0 ? (
												<Plus
													className={`w-5 h-5 ${
														txn.amount > 0
															? "text-green-600"
															: "text-red-600"
													}`}
												/>
											) : (
												<Minus className="w-5 h-5 text-red-600" />
											)}
										</div>
										<div>
											<p className="font-medium text-gray-800">
												{txn.description}
											</p>
											<p className="text-sm text-gray-500">
												{new Date(txn.createdAt).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
												})}
											</p>
										</div>
									</div>
									<p
										className={`font-bold ${
											txn.amount > 0 ? "text-green-600" : "text-red-600"
										}`}
									>
										{txn.amount > 0 ? "+" : ""}${Math.abs(txn.amount).toFixed(2)}
									</p>
								</div>
							))}
						</div>
					</div>

					{/* Account Settings */}
					<div className="lg:col-span-2 bg-white rounded-xl shadow-md overflow-hidden">
						<button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
							<div className="flex items-center gap-3">
								<Settings className="w-5 h-5 text-gray-600" />
								<span className="font-medium">Account Settings</span>
							</div>
							<ChevronRight className="w-5 h-5 text-gray-400" />
						</button>
						<button
							onClick={handleLogout}
							className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-t"
						>
							<div className="flex items-center gap-3">
								<LogOut className="w-5 h-5 text-red-500" />
								<span className="font-medium text-red-500">Log Out</span>
							</div>
						</button>
					</div>
				</div>
			</div>

			{/* Add Funds Modal */}
			{showAddFundsModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-xl max-w-md w-full p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-bold text-gray-800">Add Funds</h2>
							<button
								onClick={() => {
									setShowAddFundsModal(false);
									setAmount("");
								}}
								className="text-gray-400 hover:text-gray-600"
							>
								<X size={24} />
							</button>
						</div>

						<div className="mb-4">
							<label className="ibetu-label">Amount</label>
							<div className="relative">
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
									$
								</span>
								<input
									type="number"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									placeholder="0.00"
									className="ibetu-input pl-8 text-2xl font-bold"
								/>
							</div>
						</div>

						<div className="flex gap-2 mb-6">
							{quickAmounts.map((amt) => (
								<button
									key={amt}
									onClick={() => setAmount(amt.toString())}
									className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
										amount === amt.toString()
											? "bg-orange-500 text-white"
											: "bg-gray-100 text-gray-600 hover:bg-gray-200"
									}`}
								>
									${amt}
								</button>
							))}
						</div>

						<div className="mb-6">
							<label className="ibetu-label">Payment Method</label>
							<select
								value={selectedCard}
								onChange={(e) => setSelectedCard(e.target.value)}
								className="ibetu-input"
							>
								{mockPaymentMethods.map((method) => (
									<option key={method.id} value={method.id}>
										{method.brand} •••• {method.last4}
									</option>
								))}
							</select>
						</div>

						<button
							onClick={handleAddFunds}
							disabled={!amount || parseFloat(amount) <= 0}
							className="w-full ibetu-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Add ${amount || "0.00"}
						</button>
					</div>
				</div>
			)}

			{/* Withdraw Modal */}
			{showWithdrawModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-xl max-w-md w-full p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-bold text-gray-800">Withdraw Funds</h2>
							<button
								onClick={() => {
									setShowWithdrawModal(false);
									setAmount("");
								}}
								className="text-gray-400 hover:text-gray-600"
							>
								<X size={24} />
							</button>
						</div>

						<div className="bg-gray-50 rounded-lg p-4 mb-4">
							<p className="text-sm text-gray-500">Available Balance</p>
							<p className="text-2xl font-bold text-gray-800">
								${user.walletBalance.toFixed(2)}
							</p>
						</div>

						<div className="mb-4">
							<label className="ibetu-label">Withdrawal Amount</label>
							<div className="relative">
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
									$
								</span>
								<input
									type="number"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									max={user.walletBalance}
									placeholder="0.00"
									className="ibetu-input pl-8 text-2xl font-bold"
								/>
							</div>
							{parseFloat(amount) > user.walletBalance && (
								<p className="text-red-500 text-sm mt-1">
									Insufficient balance
								</p>
							)}
						</div>

						<div className="mb-6">
							<label className="ibetu-label">Withdraw To</label>
							<select
								value={selectedCard}
								onChange={(e) => setSelectedCard(e.target.value)}
								className="ibetu-input"
							>
								{mockPaymentMethods.map((method) => (
									<option key={method.id} value={method.id}>
										{method.brand} •••• {method.last4}
									</option>
								))}
							</select>
						</div>

						<button
							onClick={handleWithdraw}
							disabled={
								!amount ||
								parseFloat(amount) <= 0 ||
								parseFloat(amount) > user.walletBalance
							}
							className="w-full ibetu-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Withdraw ${amount || "0.00"}
						</button>
					</div>
				</div>
			)}

			{/* Add Card Modal */}
			{showAddCardModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-xl max-w-md w-full p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-bold text-gray-800">Add New Card</h2>
							<button
								onClick={() => {
									setShowAddCardModal(false);
									setCardForm({ number: "", expiry: "", cvv: "", name: "" });
								}}
								className="text-gray-400 hover:text-gray-600"
							>
								<X size={24} />
							</button>
						</div>

						<div className="space-y-4">
							<div>
								<label className="ibetu-label">Card Number</label>
								<input
									type="text"
									value={cardForm.number}
									onChange={(e) =>
										setCardForm((prev) => ({
											...prev,
											number: e.target.value
												.replace(/\D/g, "")
												.replace(/(\d{4})/g, "$1 ")
												.trim()
												.slice(0, 19),
										}))
									}
									placeholder="1234 5678 9012 3456"
									className="ibetu-input"
								/>
							</div>

							<div>
								<label className="ibetu-label">Cardholder Name</label>
								<input
									type="text"
									value={cardForm.name}
									onChange={(e) =>
										setCardForm((prev) => ({ ...prev, name: e.target.value }))
									}
									placeholder="John Doe"
									className="ibetu-input"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="ibetu-label">Expiry Date</label>
									<input
										type="text"
										value={cardForm.expiry}
										onChange={(e) =>
											setCardForm((prev) => ({
												...prev,
												expiry: e.target.value
													.replace(/\D/g, "")
													.replace(/(\d{2})(\d)/, "$1/$2")
													.slice(0, 5),
											}))
										}
										placeholder="MM/YY"
										className="ibetu-input"
									/>
								</div>
								<div>
									<label className="ibetu-label">CVV</label>
									<div className="relative">
										<input
											type={showCvv ? "text" : "password"}
											value={cardForm.cvv}
											onChange={(e) =>
												setCardForm((prev) => ({
													...prev,
													cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
												}))
											}
											placeholder="•••"
											className="ibetu-input pr-10"
										/>
										<button
											type="button"
											onClick={() => setShowCvv(!showCvv)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
										>
											{showCvv ? <EyeOff size={20} /> : <Eye size={20} />}
										</button>
									</div>
								</div>
							</div>
						</div>

						<button
							onClick={handleAddCard}
							disabled={
								!cardForm.number ||
								!cardForm.name ||
								!cardForm.expiry ||
								!cardForm.cvv
							}
							className="w-full ibetu-btn-primary mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Add Card
						</button>

						<p className="text-center text-sm text-gray-500 mt-4">
							Your card information is secure and encrypted.
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
