import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
	ArrowLeft,
	Trophy,
	Clock,
	CheckCircle,
	XCircle,
	Plus,
	TrendingUp,
	Share2,
	Swords,
} from "lucide-react";
import { currentUser, mockFriends, mockBets, getUserById } from "../../data/mockData";
import { shareLink, generateProfileLink } from "../../lib/sharing";
import type { Bet } from "../../data/types";

export const Route = createFileRoute("/friends/$friendId")({
	component: FriendHistoryPage,
});

function FriendHistoryPage() {
	const { friendId } = Route.useParams();
	const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

	// Find the friend
	const friend = mockFriends.find((f) => f.user.id === friendId)?.user ||
		getUserById(friendId);

	if (!friend) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-gray-800 mb-2">
						Friend not found
					</h2>
					<Link to="/friends" className="ibetu-btn-primary">
						Back to Friends
					</Link>
				</div>
			</div>
		);
	}

	// Get bets between current user and this friend
	const betHistory = mockBets.filter(
		(b) =>
			(b.creatorId === currentUser.id && b.opponentId === friendId) ||
			(b.creatorId === friendId && b.opponentId === currentUser.id)
	);

	const filteredBets = betHistory.filter((bet) => {
		if (filter === "all") return true;
		if (filter === "active") return bet.status === "active";
		if (filter === "completed") return bet.status === "completed";
		return true;
	});

	// Calculate stats
	const completedBets = betHistory.filter((b) => b.status === "completed");
	const userWins = completedBets.filter(
		(b) => b.winnerId === currentUser.id
	).length;
	const friendWins = completedBets.filter((b) => b.winnerId === friendId).length;
	const activeBets = betHistory.filter((b) => b.status === "active").length;
	const totalAmount = completedBets.reduce((sum, b) => sum + b.amount, 0);

	const handleShare = () => {
		shareLink({
			title: `${currentUser.displayName} vs ${friend.displayName}`,
			text: `Check out our betting rivalry on IBetU! ${userWins}-${friendWins}`,
			url: generateProfileLink(friend.username),
		});
	};

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header */}
			<div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
				<div className="max-w-4xl mx-auto px-6 py-6">
					<Link
						to="/friends"
						className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4"
					>
						<ArrowLeft size={20} />
						Back to Friends
					</Link>

					{/* VS Header */}
					<div className="flex items-center justify-center gap-6 py-4">
						<div className="text-center">
							<img
								src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`}
								alt={currentUser.displayName}
								className="w-20 h-20 rounded-full bg-white/20 mx-auto mb-2"
							/>
							<p className="font-medium">You</p>
							<p className="text-3xl font-bold">{userWins}</p>
						</div>

						<div className="text-center">
							<Swords className="w-12 h-12 mx-auto mb-2 opacity-50" />
							<span className="text-2xl font-bold">VS</span>
						</div>

						<div className="text-center">
							<img
								src={friend.avatar}
								alt={friend.displayName}
								className="w-20 h-20 rounded-full bg-white/20 mx-auto mb-2"
							/>
							<p className="font-medium">{friend.displayName}</p>
							<p className="text-3xl font-bold">{friendWins}</p>
						</div>
					</div>

					{/* Share button */}
					<div className="text-center">
						<button
							onClick={handleShare}
							className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
						>
							<Share2 size={16} />
							Share Rivalry
						</button>
					</div>
				</div>
			</div>

			{/* Stats */}
			<div className="max-w-4xl mx-auto px-6 -mt-4">
				<div className="bg-white rounded-xl shadow-md p-6 grid grid-cols-4 gap-4">
					<div className="text-center">
						<p className="text-2xl font-bold text-gray-800">
							{betHistory.length}
						</p>
						<p className="text-sm text-gray-500">Total Bets</p>
					</div>
					<div className="text-center">
						<p className="text-2xl font-bold text-orange-500">{activeBets}</p>
						<p className="text-sm text-gray-500">Active</p>
					</div>
					<div className="text-center">
						<p className="text-2xl font-bold text-green-500">
							${totalAmount}
						</p>
						<p className="text-sm text-gray-500">Total Wagered</p>
					</div>
					<div className="text-center">
						<p className="text-2xl font-bold text-purple-500">
							{userWins > friendWins ? "You!" : friendWins > userWins ? friend.displayName.split(" ")[0] : "Tied"}
						</p>
						<p className="text-sm text-gray-500">Leading</p>
					</div>
				</div>
			</div>

			{/* Actions */}
			<div className="max-w-4xl mx-auto px-6 py-6">
				<div className="flex gap-4">
					<Link
						to="/bets/create"
						search={{ friendId: friend.id }}
						className="flex-1 ibetu-btn-primary flex items-center justify-center gap-2"
					>
						<Plus size={20} />
						New Bet with {friend.displayName.split(" ")[0]}
					</Link>
				</div>
			</div>

			{/* Filter Tabs */}
			<div className="max-w-4xl mx-auto px-6">
				<div className="flex gap-2 mb-4">
					{(["all", "active", "completed"] as const).map((f) => (
						<button
							key={f}
							onClick={() => setFilter(f)}
							className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
								filter === f
									? "bg-orange-500 text-white"
									: "bg-white text-gray-600 hover:bg-gray-100"
							}`}
						>
							{f.charAt(0).toUpperCase() + f.slice(1)}
						</button>
					))}
				</div>
			</div>

			{/* Bet History */}
			<div className="max-w-4xl mx-auto px-6 pb-8">
				{filteredBets.length > 0 ? (
					<div className="space-y-4">
						{filteredBets.map((bet) => (
							<BetHistoryCard
								key={bet.id}
								bet={bet}
								currentUserId={currentUser.id}
								friendName={friend.displayName}
							/>
						))}
					</div>
				) : (
					<div className="bg-white rounded-xl shadow-md p-12 text-center">
						<Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
						<h3 className="text-lg font-medium text-gray-800 mb-2">
							No {filter !== "all" ? filter : ""} bets yet
						</h3>
						<p className="text-gray-500 mb-4">
							Start a friendly wager with {friend.displayName}!
						</p>
						<Link
							to="/bets/create"
							search={{ friendId: friend.id }}
							className="ibetu-btn-primary inline-flex items-center gap-2"
						>
							<Plus size={20} />
							Create a Bet
						</Link>
					</div>
				)}
			</div>
		</div>
	);
}

function BetHistoryCard({
	bet,
	currentUserId,
	friendName,
}: {
	bet: Bet;
	currentUserId: string;
	friendName: string;
}) {
	const isCreator = bet.creatorId === currentUserId;
	const isWinner = bet.winnerId === currentUserId;
	const isLoser = bet.status === "completed" && bet.winnerId !== currentUserId;

	const getStatusIcon = () => {
		switch (bet.status) {
			case "active":
				return <Clock className="w-5 h-5 text-orange-500" />;
			case "completed":
				return isWinner ? (
					<CheckCircle className="w-5 h-5 text-green-500" />
				) : (
					<XCircle className="w-5 h-5 text-red-500" />
				);
			default:
				return <Clock className="w-5 h-5 text-gray-500" />;
		}
	};

	return (
		<Link
			to="/bets/$betId"
			params={{ betId: bet.id }}
			className="block bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
		>
			<div className="flex items-start gap-4">
				<div
					className={`w-12 h-12 rounded-full flex items-center justify-center ${
						bet.status === "completed"
							? isWinner
								? "bg-green-100"
								: "bg-red-100"
							: "bg-orange-100"
					}`}
				>
					{getStatusIcon()}
				</div>

				<div className="flex-1">
					<div className="flex items-start justify-between">
						<div>
							<h3 className="font-semibold text-gray-800">{bet.title}</h3>
							<p className="text-sm text-gray-500 mt-1">
								{isCreator ? "You challenged" : `${friendName} challenged you`}
							</p>
						</div>
						<div className="text-right">
							<p
								className={`text-xl font-bold ${
									bet.status === "completed"
										? isWinner
											? "text-green-500"
											: "text-red-500"
										: "text-orange-500"
								}`}
							>
								{bet.status === "completed" && !isWinner && "-"}${bet.amount}
							</p>
							{bet.status === "completed" && (
								<span
									className={`text-xs px-2 py-1 rounded-full ${
										isWinner
											? "bg-green-100 text-green-600"
											: "bg-red-100 text-red-600"
									}`}
								>
									{isWinner ? "Won" : "Lost"}
								</span>
							)}
						</div>
					</div>

					<div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
						<span>
							{new Date(bet.createdAt).toLocaleDateString("en-US", {
								month: "short",
								day: "numeric",
								year: "numeric",
							})}
						</span>
						<span className="px-2 py-1 bg-gray-100 rounded-full capitalize">
							{bet.verificationMethod.replace("_", " ")}
						</span>
					</div>
				</div>
			</div>
		</Link>
	);
}
