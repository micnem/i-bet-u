import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
	ArrowLeft,
	Clock,
	Calendar,
	Shield,
	DollarSign,
	CheckCircle,
	XCircle,
	AlertCircle,
	Trophy,
	User,
	Share2,
} from "lucide-react";
import { currentUser, mockBets, mockBetInvites, getUserById } from "../../data/mockData";
import { shareLink, getBetShareData } from "../../lib/sharing";

export const Route = createFileRoute("/bets/$betId")({
	component: BetDetailsPage,
});

function BetDetailsPage() {
	const { betId } = Route.useParams();
	const navigate = useNavigate();
	const [showResolveModal, setShowResolveModal] = useState(false);
	const [selectedWinner, setSelectedWinner] = useState<string | null>(null);

	// Find the bet - check both active bets and pending invites
	const bet = mockBets.find((b) => b.id === betId);
	const invite = mockBetInvites.find((i) => i.bet.id === betId);
	const displayBet = bet || invite?.bet;

	if (!displayBet) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="text-center">
					<AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
					<h2 className="text-xl font-semibold text-gray-800 mb-2">
						Bet not found
					</h2>
					<p className="text-gray-500 mb-4">
						This bet doesn't exist or has been removed.
					</p>
					<Link to="/bets" className="ibetu-btn-primary">
						Back to Bets
					</Link>
				</div>
			</div>
		);
	}

	const user = currentUser;
	const isCreator = displayBet.creatorId === user.id;
	const opponent = isCreator
		? getUserById(displayBet.opponentId)
		: getUserById(displayBet.creatorId);
	const isPending = displayBet.status === "pending" && !isCreator;
	const isActive = displayBet.status === "active";
	const isCompleted = displayBet.status === "completed";
	const isWinner = displayBet.winnerId === user.id;

	const handleAccept = () => {
		// Mock accept - in real app would update backend
		navigate({ to: "/dashboard" });
	};

	const handleDecline = () => {
		// Mock decline
		navigate({ to: "/dashboard" });
	};

	const handleResolve = () => {
		if (selectedWinner) {
			// Mock resolve - in real app would update backend
			setShowResolveModal(false);
			navigate({ to: "/dashboard" });
		}
	};

	const handleShare = () => {
		shareLink(
			getBetShareData({
				id: displayBet.id,
				title: displayBet.title,
				amount: displayBet.amount,
			})
		);
	};

	const getStatusBadge = () => {
		if (isCompleted) {
			return isWinner ? (
				<span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium flex items-center gap-1">
					<Trophy size={16} />
					You Won!
				</span>
			) : (
				<span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium flex items-center gap-1">
					<XCircle size={16} />
					You Lost
				</span>
			);
		}
		if (isActive) {
			return (
				<span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium flex items-center gap-1">
					<Clock size={16} />
					Active
				</span>
			);
		}
		if (isPending) {
			return (
				<span className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded-full text-sm font-medium flex items-center gap-1">
					<AlertCircle size={16} />
					Awaiting Your Response
				</span>
			);
		}
		return (
			<span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
				{displayBet.status}
			</span>
		);
	};

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header */}
			<div
				className={`py-8 px-6 ${
					isCompleted
						? isWinner
							? "bg-gradient-to-r from-green-500 to-green-600"
							: "bg-gradient-to-r from-red-500 to-red-600"
						: "bg-gradient-to-r from-orange-500 to-orange-600"
				} text-white`}
			>
				<div className="max-w-2xl mx-auto">
					<div className="flex items-center justify-between mb-4">
						<Link
							to="/bets"
							className="inline-flex items-center gap-2 text-white/80 hover:text-white"
						>
							<ArrowLeft size={20} />
							Back to Bets
						</Link>
						<button
							onClick={handleShare}
							className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
						>
							<Share2 size={16} />
							Share
						</button>
					</div>

					<div className="flex items-start justify-between">
						<div>
							<h1 className="text-2xl font-bold">{displayBet.title}</h1>
							{getStatusBadge()}
						</div>
						<div className="text-right">
							<p className="text-3xl font-bold">${displayBet.amount}</p>
							<p className="text-sm opacity-80">
								{isCompleted ? "Final Amount" : "At Stake"}
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-2xl mx-auto px-6 py-8">
				{/* Pending Invite Actions */}
				{isPending && (
					<div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
						<h2 className="text-lg font-semibold text-yellow-800 mb-2">
							You've been challenged!
						</h2>
						<p className="text-yellow-700 mb-4">
							{opponent?.displayName} wants to bet ${displayBet.amount} on this.
							Do you accept?
						</p>
						<div className="flex gap-3">
							<button
								onClick={handleAccept}
								className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
							>
								<CheckCircle size={20} />
								Accept Bet
							</button>
							<button
								onClick={handleDecline}
								className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
							>
								<XCircle size={20} />
								Decline
							</button>
						</div>
					</div>
				)}

				{/* Main Content */}
				<div className="bg-white rounded-xl shadow-md overflow-hidden">
					{/* Description */}
					<div className="p-6 border-b">
						<h2 className="text-sm font-medium text-gray-500 mb-2">
							Description
						</h2>
						<p className="text-gray-800">{displayBet.description}</p>
					</div>

					{/* Participants */}
					<div className="p-6 border-b">
						<h2 className="text-sm font-medium text-gray-500 mb-4">
							Participants
						</h2>
						<div className="flex items-center justify-between">
							{/* Creator */}
							<div className="flex items-center gap-3">
								<div className="relative">
									<img
										src={
											isCreator
												? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
												: opponent?.avatar
										}
										alt=""
										className="w-12 h-12 rounded-full bg-gray-200"
									/>
									{isCompleted &&
										displayBet.winnerId ===
											(isCreator ? user.id : opponent?.id) && (
											<Trophy className="absolute -top-1 -right-1 w-5 h-5 text-yellow-500" />
										)}
								</div>
								<div>
									<p className="font-medium">
										{isCreator ? "You" : opponent?.displayName}
									</p>
									<p className="text-sm text-gray-500">Challenger</p>
								</div>
							</div>

							<div className="text-2xl font-bold text-gray-300">VS</div>

							{/* Opponent */}
							<div className="flex items-center gap-3">
								<div>
									<p className="font-medium text-right">
										{isCreator ? opponent?.displayName : "You"}
									</p>
									<p className="text-sm text-gray-500 text-right">Challenged</p>
								</div>
								<div className="relative">
									<img
										src={
											isCreator
												? opponent?.avatar
												: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
										}
										alt=""
										className="w-12 h-12 rounded-full bg-gray-200"
									/>
									{isCompleted &&
										displayBet.winnerId ===
											(isCreator ? opponent?.id : user.id) && (
											<Trophy className="absolute -top-1 -right-1 w-5 h-5 text-yellow-500" />
										)}
								</div>
							</div>
						</div>
					</div>

					{/* Details Grid */}
					<div className="grid grid-cols-2 border-b">
						<div className="p-6 border-r">
							<div className="flex items-center gap-2 text-gray-500 mb-2">
								<Calendar size={16} />
								<span className="text-sm font-medium">Deadline</span>
							</div>
							<p className="font-medium text-gray-800">
								{new Date(displayBet.deadline).toLocaleDateString("en-US", {
									month: "long",
									day: "numeric",
									year: "numeric",
								})}
							</p>
							<p className="text-sm text-gray-500">
								{new Date(displayBet.deadline).toLocaleTimeString("en-US", {
									hour: "2-digit",
									minute: "2-digit",
								})}
							</p>
						</div>
						<div className="p-6">
							<div className="flex items-center gap-2 text-gray-500 mb-2">
								<Shield size={16} />
								<span className="text-sm font-medium">Verification</span>
							</div>
							<p className="font-medium text-gray-800 capitalize">
								{displayBet.verificationMethod.replace("_", " ")}
							</p>
						</div>
					</div>

					{/* Timestamps */}
					<div className="p-6 bg-gray-50 text-sm text-gray-500">
						<p>
							Created:{" "}
							{new Date(displayBet.createdAt).toLocaleDateString("en-US", {
								month: "short",
								day: "numeric",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							})}
						</p>
						{displayBet.acceptedAt && (
							<p>
								Accepted:{" "}
								{new Date(displayBet.acceptedAt).toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
									year: "numeric",
									hour: "2-digit",
									minute: "2-digit",
								})}
							</p>
						)}
						{displayBet.resolvedAt && (
							<p>
								Resolved:{" "}
								{new Date(displayBet.resolvedAt).toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
									year: "numeric",
									hour: "2-digit",
									minute: "2-digit",
								})}
							</p>
						)}
					</div>
				</div>

				{/* Active Bet Actions */}
				{isActive && (
					<div className="mt-6">
						<button
							onClick={() => setShowResolveModal(true)}
							className="w-full ibetu-btn-primary flex items-center justify-center gap-2"
						>
							<CheckCircle size={20} />
							Resolve Bet
						</button>
						<p className="text-center text-sm text-gray-500 mt-2">
							Both parties must agree on the winner
						</p>
					</div>
				)}

				{/* Completed Summary */}
				{isCompleted && (
					<div
						className={`mt-6 p-6 rounded-xl ${
							isWinner ? "bg-green-50" : "bg-red-50"
						}`}
					>
						<div className="flex items-center justify-between">
							<div>
								<p
									className={`text-sm font-medium ${
										isWinner ? "text-green-600" : "text-red-600"
									}`}
								>
									{isWinner ? "Congratulations!" : "Better luck next time!"}
								</p>
								<p
									className={`text-2xl font-bold ${
										isWinner ? "text-green-700" : "text-red-700"
									}`}
								>
									{isWinner ? `+$${displayBet.amount * 2}` : `-$${displayBet.amount}`}
								</p>
							</div>
							<Trophy
								className={`w-12 h-12 ${
									isWinner ? "text-green-500" : "text-gray-300"
								}`}
							/>
						</div>
					</div>
				)}
			</div>

			{/* Resolve Modal */}
			{showResolveModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-xl max-w-md w-full p-6">
						<h2 className="text-xl font-bold text-gray-800 mb-4">
							Who Won the Bet?
						</h2>
						<p className="text-gray-600 mb-6">
							Select the winner. Both parties must agree for the bet to be
							resolved.
						</p>

						<div className="space-y-3">
							<button
								onClick={() => setSelectedWinner(user.id)}
								className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
									selectedWinner === user.id
										? "border-green-500 bg-green-50"
										: "border-gray-200 hover:border-gray-300"
								}`}
							>
								<User className="w-6 h-6 text-gray-600" />
								<span className="font-medium">I Won</span>
								{selectedWinner === user.id && (
									<CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
								)}
							</button>

							<button
								onClick={() => setSelectedWinner(opponent?.id || "")}
								className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
									selectedWinner === opponent?.id
										? "border-green-500 bg-green-50"
										: "border-gray-200 hover:border-gray-300"
								}`}
							>
								<img
									src={opponent?.avatar}
									alt=""
									className="w-6 h-6 rounded-full bg-gray-200"
								/>
								<span className="font-medium">
									{opponent?.displayName} Won
								</span>
								{selectedWinner === opponent?.id && (
									<CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
								)}
							</button>
						</div>

						<div className="flex gap-3 mt-6">
							<button
								onClick={() => setShowResolveModal(false)}
								className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
							>
								Cancel
							</button>
							<button
								onClick={handleResolve}
								disabled={!selectedWinner}
								className="flex-1 ibetu-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Confirm
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
