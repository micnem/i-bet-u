import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/tanstack-react-start";
import {
	ArrowLeft,
	AlertCircle,
	Loader2,
	Clock,
	CheckCircle,
	XCircle,
	Trophy,
	Calendar,
	DollarSign,
	User,
	TimerOff,
} from "lucide-react";
import {
	getBetById,
	acceptBet,
	declineBet,
	approveBetResult,
} from "../../api/bets";
import type { BetStatus } from "../../lib/database.types";
import { getDisplayStatus, type DisplayStatus } from "../../lib/bet-utils";

export const Route = createFileRoute("/bets/$betId")({
	component: BetDetailsPage,
});

interface Bet {
	id: string;
	title: string;
	description: string | null;
	amount: number;
	status: BetStatus;
	deadline: string;
	created_at: string;
	accepted_at: string | null;
	resolved_at: string | null;
	creator_id: string;
	opponent_id: string;
	winner_id: string | null;
	creator_approved: boolean;
	opponent_approved: boolean;
	verification_method: string;
	creator: {
		id: string;
		clerk_id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
	opponent: {
		id: string;
		clerk_id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
	winner?: {
		id: string;
		clerk_id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	} | null;
}

function BetDetailsPage() {
	const { betId } = Route.useParams();
	const { user: clerkUser } = useUser();
	const navigate = useNavigate();

	const [bet, setBet] = useState<Bet | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [actionLoading, setActionLoading] = useState(false);

	useEffect(() => {
		async function fetchBet() {
			setLoading(true);
			const result = await getBetById({ data: { betId } });
			if (result.error) {
				setError(result.error);
			} else if (result.data) {
				setBet(result.data as Bet);
			}
			setLoading(false);
		}
		fetchBet();
	}, [betId]);

	const handleAccept = async () => {
		setActionLoading(true);
		const result = await acceptBet({ data: { betId } });
		if (result.error) {
			setError(result.error);
		} else {
			// Refresh bet data
			const refreshed = await getBetById({ data: { betId } });
			if (refreshed.data) setBet(refreshed.data as Bet);
		}
		setActionLoading(false);
	};

	const handleDecline = async () => {
		setActionLoading(true);
		const result = await declineBet({ data: { betId } });
		if (result.error) {
			setError(result.error);
		} else {
			navigate({ to: "/bets" });
		}
		setActionLoading(false);
	};

	const handleApproveWinner = async (winnerId: string) => {
		setActionLoading(true);
		const result = await approveBetResult({ data: { betId, winnerId } });
		if (result.error) {
			setError(result.error);
		} else {
			// Refresh bet data
			const refreshed = await getBetById({ data: { betId } });
			if (refreshed.data) setBet(refreshed.data as Bet);
		}
		setActionLoading(false);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	};

	const getStatusBadgeStyle = (status: DisplayStatus) => {
		switch (status) {
			case "active":
				return "bg-orange-100 text-orange-700";
			case "pending":
				return "bg-yellow-100 text-yellow-700";
			case "completed":
				return "bg-green-100 text-green-700";
			case "deadline_passed":
				return "bg-red-100 text-red-700";
			default:
				return "bg-gray-100 text-gray-700";
		}
	};

	const getStatusLabel = (status: DisplayStatus) => {
		if (status === "deadline_passed") {
			return "Deadline Passed";
		}
		return status.charAt(0).toUpperCase() + status.slice(1);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<Loader2 className="w-8 h-8 animate-spin text-orange-500" />
			</div>
		);
	}

	if (error || !bet) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="text-center">
					<AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
					<h2 className="text-xl font-semibold text-gray-800 mb-2">
						{error || "Bet not found"}
					</h2>
					<p className="text-gray-500 mb-4">
						This bet doesn't exist or you don't have access to it.
					</p>
					<Link to="/bets" className="ibetu-btn-primary">
						Back to Bets
					</Link>
				</div>
			</div>
		);
	}

	const isCreator = clerkUser && clerkUser.id === bet.creator.clerk_id;
	const isOpponent = clerkUser && clerkUser.id === bet.opponent.clerk_id;
	const isPending = bet.status === "pending";
	const isActive = bet.status === "active";
	const isCompleted = bet.status === "completed";
	const displayStatus = getDisplayStatus(bet.status, bet.deadline);
	const isDeadlinePassed = displayStatus === "deadline_passed";

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header */}
			<div className="bg-white shadow">
				<div className="max-w-2xl mx-auto px-6 py-4">
					<Link
						to="/bets"
						className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
					>
						<ArrowLeft size={20} />
						Back to Bets
					</Link>
					<div className="flex items-center justify-between">
						<h1 className="text-2xl font-bold text-gray-800">{bet.title}</h1>
						<span
							className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusBadgeStyle(displayStatus)}`}
						>
							{getStatusLabel(displayStatus)}
						</span>
					</div>
				</div>
			</div>

			<div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
				{/* Bet Info Card */}
				<div className="bg-white rounded-xl shadow-md p-6">
					{bet.description && (
						<p className="text-gray-600 mb-6">{bet.description}</p>
					)}

					<div className="grid grid-cols-2 gap-4">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
								<DollarSign className="w-5 h-5 text-green-600" />
							</div>
							<div>
								<p className="text-sm text-gray-500">Amount</p>
								<p className="font-bold text-lg">${bet.amount}</p>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
								<Calendar className="w-5 h-5 text-blue-600" />
							</div>
							<div>
								<p className="text-sm text-gray-500">Deadline</p>
								<p className="font-medium text-sm">{formatDate(bet.deadline)}</p>
							</div>
						</div>
					</div>

					<div className="mt-6 pt-6 border-t">
						<p className="text-sm text-gray-500 mb-2">Verification Method</p>
						<p className="font-medium capitalize">
							{bet.verification_method.replace("_", " ")}
						</p>
					</div>
				</div>

				{/* Participants */}
				<div className="bg-white rounded-xl shadow-md p-6">
					<h3 className="font-semibold text-gray-800 mb-4">Participants</h3>

					<div className="space-y-4">
						{/* Creator */}
						<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
									{bet.creator.avatar_url ? (
										<img
											src={bet.creator.avatar_url}
											alt={bet.creator.display_name}
											className="w-full h-full object-cover"
										/>
									) : (
										<span className="text-lg font-bold text-white">
											{bet.creator.display_name.charAt(0).toUpperCase()}
										</span>
									)}
								</div>
								<div>
									<p className="font-medium text-gray-800">
										{bet.creator.display_name}
									</p>
									<p className="text-sm text-gray-500">Creator</p>
								</div>
							</div>
							{isCompleted && bet.winner_id === bet.creator_id && (
								<Trophy className="w-6 h-6 text-yellow-500" />
							)}
							{isActive && bet.creator_approved && (
								<CheckCircle className="w-5 h-5 text-green-500" />
							)}
						</div>

						{/* Opponent */}
						<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
									{bet.opponent.avatar_url ? (
										<img
											src={bet.opponent.avatar_url}
											alt={bet.opponent.display_name}
											className="w-full h-full object-cover"
										/>
									) : (
										<span className="text-lg font-bold text-white">
											{bet.opponent.display_name.charAt(0).toUpperCase()}
										</span>
									)}
								</div>
								<div>
									<p className="font-medium text-gray-800">
										{bet.opponent.display_name}
									</p>
									<p className="text-sm text-gray-500">Opponent</p>
								</div>
							</div>
							{isCompleted && bet.winner_id === bet.opponent_id && (
								<Trophy className="w-6 h-6 text-yellow-500" />
							)}
							{isActive && bet.opponent_approved && (
								<CheckCircle className="w-5 h-5 text-green-500" />
							)}
						</div>
					</div>
				</div>

				{/* Deadline Passed Warning */}
				{isDeadlinePassed && (
					<div className="bg-red-50 rounded-xl p-6">
						<div className="flex items-center gap-3">
							<TimerOff className="w-6 h-6 text-red-500" />
							<div>
								<p className="font-medium text-gray-800">Deadline Has Passed</p>
								<p className="text-sm text-gray-600">
									The deadline for this bet has passed. No further actions can be taken.
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Actions */}
				{isPending && isOpponent && !isDeadlinePassed && (
					<div className="bg-white rounded-xl shadow-md p-6">
						<h3 className="font-semibold text-gray-800 mb-4">
							Bet Invitation
						</h3>
						<p className="text-gray-600 mb-4">
							{bet.creator.display_name} has challenged you to this bet. Do you
							accept?
						</p>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={handleAccept}
								disabled={actionLoading}
								className="flex-1 ibetu-btn-primary flex items-center justify-center gap-2"
							>
								{actionLoading ? (
									<Loader2 className="w-5 h-5 animate-spin" />
								) : (
									<CheckCircle className="w-5 h-5" />
								)}
								Accept Bet
							</button>
							<button
								type="button"
								onClick={handleDecline}
								disabled={actionLoading}
								className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 flex items-center justify-center gap-2"
							>
								<XCircle className="w-5 h-5" />
								Decline
							</button>
						</div>
					</div>
				)}

				{isPending && isCreator && !isDeadlinePassed && (
					<div className="bg-yellow-50 rounded-xl p-6">
						<div className="flex items-center gap-3">
							<Clock className="w-6 h-6 text-yellow-500" />
							<div>
								<p className="font-medium text-gray-800">
									Waiting for Response
								</p>
								<p className="text-sm text-gray-600">
									{bet.opponent.display_name} hasn't responded to your bet yet.
								</p>
							</div>
						</div>
					</div>
				)}

				{isActive && (
					<div className="bg-white rounded-xl shadow-md p-6">
						<h3 className="font-semibold text-gray-800 mb-4">
							Declare Winner
						</h3>
						<p className="text-gray-600 mb-4">
							Who won this bet? Both participants must agree on the winner.
						</p>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => handleApproveWinner(bet.creator_id)}
								disabled={actionLoading}
								className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
							>
								{actionLoading ? (
									<Loader2 className="w-5 h-5 animate-spin" />
								) : (
									<User className="w-5 h-5" />
								)}
								{bet.creator.display_name}
							</button>
							<button
								type="button"
								onClick={() => handleApproveWinner(bet.opponent_id)}
								disabled={actionLoading}
								className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
							>
								{actionLoading ? (
									<Loader2 className="w-5 h-5 animate-spin" />
								) : (
									<User className="w-5 h-5" />
								)}
								{bet.opponent.display_name}
							</button>
						</div>
						{(bet.creator_approved || bet.opponent_approved) && (
							<p className="text-sm text-gray-500 mt-4 text-center">
								{bet.creator_approved && !bet.opponent_approved && (
									<>Creator has approved. Waiting for opponent.</>
								)}
								{!bet.creator_approved && bet.opponent_approved && (
									<>Opponent has approved. Waiting for creator.</>
								)}
							</p>
						)}
					</div>
				)}

				{isCompleted && bet.winner && (
					<div className="bg-green-50 rounded-xl p-6">
						<div className="flex items-center gap-3">
							<Trophy className="w-6 h-6 text-yellow-500" />
							<div>
								<p className="font-medium text-gray-800">Bet Completed</p>
								<p className="text-sm text-gray-600">
									{bet.winner.display_name} won ${bet.amount}!
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Timeline */}
				<div className="bg-white rounded-xl shadow-md p-6">
					<h3 className="font-semibold text-gray-800 mb-4">Timeline</h3>
					<div className="space-y-3 text-sm">
						<div className="flex justify-between">
							<span className="text-gray-500">Created</span>
							<span className="text-gray-800">{formatDate(bet.created_at)}</span>
						</div>
						{bet.accepted_at && (
							<div className="flex justify-between">
								<span className="text-gray-500">Accepted</span>
								<span className="text-gray-800">
									{formatDate(bet.accepted_at)}
								</span>
							</div>
						)}
						{bet.resolved_at && (
							<div className="flex justify-between">
								<span className="text-gray-500">Resolved</span>
								<span className="text-gray-800">
									{formatDate(bet.resolved_at)}
								</span>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
