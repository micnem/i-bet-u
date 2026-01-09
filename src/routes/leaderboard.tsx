import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
	Trophy,
	Medal,
	Crown,
	TrendingUp,
	Share2,
	Users,
	Target,
} from "lucide-react";
import { currentUser, mockUsers, mockFriends } from "../data/mockData";
import { shareLink, getLeaderboardShareData } from "../lib/sharing";

export const Route = createFileRoute("/leaderboard")({
	component: LeaderboardPage,
});

type Timeframe = "all" | "month" | "week";
type LeaderboardType = "global" | "friends";

function LeaderboardPage() {
	const [timeframe, setTimeframe] = useState<Timeframe>("all");
	const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>("global");

	// Create mock leaderboard data
	const allUsers = [currentUser, ...mockUsers].map((user, index) => ({
		...user,
		rank: 0,
		winRate: user.stats.winRate,
	}));

	// Sort by wins
	const sortedUsers = [...allUsers].sort(
		(a, b) => b.stats.won - a.stats.won
	);

	// Assign ranks
	sortedUsers.forEach((user, index) => {
		user.rank = index + 1;
	});

	// Filter for friends only if needed
	const friendIds = mockFriends.map((f) => f.user.id);
	const leaderboard =
		leaderboardType === "friends"
			? sortedUsers.filter(
					(u) => u.id === currentUser.id || friendIds.includes(u.id)
				)
			: sortedUsers;

	// Find current user's rank
	const currentUserRank =
		sortedUsers.findIndex((u) => u.id === currentUser.id) + 1;

	const handleShare = () => {
		shareLink(getLeaderboardShareData(currentUserRank, currentUser.displayName));
	};

	const getRankIcon = (rank: number) => {
		switch (rank) {
			case 1:
				return <Crown className="w-6 h-6 text-yellow-500" />;
			case 2:
				return <Medal className="w-6 h-6 text-gray-400" />;
			case 3:
				return <Medal className="w-6 h-6 text-amber-600" />;
			default:
				return (
					<span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">
						{rank}
					</span>
				);
		}
	};

	const getRankBgColor = (rank: number) => {
		switch (rank) {
			case 1:
				return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300";
			case 2:
				return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300";
			case 3:
				return "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300";
			default:
				return "bg-white border-gray-200";
		}
	};

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header */}
			<div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-8 px-6">
				<div className="max-w-4xl mx-auto">
					<div className="flex items-center justify-between mb-6">
						<div>
							<h1 className="text-2xl font-bold flex items-center gap-2">
								<Trophy className="w-8 h-8" />
								Leaderboard
							</h1>
							<p className="text-purple-200">See who's winning the most bets</p>
						</div>
						<button
							onClick={handleShare}
							className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
						>
							<Share2 size={18} />
							Share
						</button>
					</div>

					{/* Current User Rank Card */}
					<div className="bg-white/10 backdrop-blur rounded-xl p-6">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<div className="relative">
									<img
										src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`}
										alt={currentUser.displayName}
										className="w-16 h-16 rounded-full bg-white/20"
									/>
									<div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
										#{currentUserRank}
									</div>
								</div>
								<div>
									<p className="text-lg font-semibold">Your Rank</p>
									<p className="text-purple-200">@{currentUser.username}</p>
								</div>
							</div>
							<div className="text-right">
								<p className="text-3xl font-bold">{currentUser.stats.won}</p>
								<p className="text-purple-200">Wins</p>
							</div>
						</div>

						<div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
							<div className="text-center">
								<p className="text-2xl font-bold">{currentUser.stats.totalBets}</p>
								<p className="text-sm text-purple-200">Total Bets</p>
							</div>
							<div className="text-center">
								<p className="text-2xl font-bold">{currentUser.stats.winRate}%</p>
								<p className="text-sm text-purple-200">Win Rate</p>
							</div>
							<div className="text-center">
								<p className="text-2xl font-bold">{currentUser.stats.lost}</p>
								<p className="text-sm text-purple-200">Losses</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-4xl mx-auto px-6 py-6">
				{/* Filters */}
				<div className="flex flex-col sm:flex-row gap-4 mb-6">
					{/* Leaderboard Type */}
					<div className="flex gap-2">
						<button
							onClick={() => setLeaderboardType("global")}
							className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
								leaderboardType === "global"
									? "bg-purple-600 text-white"
									: "bg-white text-gray-600 hover:bg-gray-100"
							}`}
						>
							<Target size={18} />
							Global
						</button>
						<button
							onClick={() => setLeaderboardType("friends")}
							className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
								leaderboardType === "friends"
									? "bg-purple-600 text-white"
									: "bg-white text-gray-600 hover:bg-gray-100"
							}`}
						>
							<Users size={18} />
							Friends Only
						</button>
					</div>

					{/* Timeframe */}
					<div className="flex gap-2 sm:ml-auto">
						{(["all", "month", "week"] as Timeframe[]).map((t) => (
							<button
								key={t}
								onClick={() => setTimeframe(t)}
								className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
									timeframe === t
										? "bg-gray-800 text-white"
										: "bg-white text-gray-600 hover:bg-gray-100"
								}`}
							>
								{t === "all" ? "All Time" : t === "month" ? "This Month" : "This Week"}
							</button>
						))}
					</div>
				</div>

				{/* Top 3 Podium */}
				{leaderboard.length >= 3 && (
					<div className="flex items-end justify-center gap-4 mb-8">
						{/* 2nd Place */}
						<div className="text-center">
							<img
								src={leaderboard[1].avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboard[1].username}`}
								alt={leaderboard[1].displayName}
								className="w-16 h-16 rounded-full mx-auto mb-2 border-4 border-gray-300"
							/>
							<div className="bg-gray-200 rounded-t-lg px-6 py-8">
								<Medal className="w-8 h-8 text-gray-400 mx-auto mb-2" />
								<p className="font-semibold text-gray-800 truncate max-w-[100px]">
									{leaderboard[1].displayName}
								</p>
								<p className="text-2xl font-bold text-gray-600">
									{leaderboard[1].stats.won}
								</p>
								<p className="text-xs text-gray-500">wins</p>
							</div>
						</div>

						{/* 1st Place */}
						<div className="text-center">
							<img
								src={leaderboard[0].avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboard[0].username}`}
								alt={leaderboard[0].displayName}
								className="w-20 h-20 rounded-full mx-auto mb-2 border-4 border-yellow-400"
							/>
							<div className="bg-gradient-to-b from-yellow-300 to-yellow-400 rounded-t-lg px-8 py-12">
								<Crown className="w-10 h-10 text-yellow-600 mx-auto mb-2" />
								<p className="font-bold text-yellow-900 truncate max-w-[120px]">
									{leaderboard[0].displayName}
								</p>
								<p className="text-3xl font-bold text-yellow-800">
									{leaderboard[0].stats.won}
								</p>
								<p className="text-xs text-yellow-700">wins</p>
							</div>
						</div>

						{/* 3rd Place */}
						<div className="text-center">
							<img
								src={leaderboard[2].avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboard[2].username}`}
								alt={leaderboard[2].displayName}
								className="w-16 h-16 rounded-full mx-auto mb-2 border-4 border-amber-500"
							/>
							<div className="bg-amber-100 rounded-t-lg px-6 py-6">
								<Medal className="w-8 h-8 text-amber-600 mx-auto mb-2" />
								<p className="font-semibold text-amber-900 truncate max-w-[100px]">
									{leaderboard[2].displayName}
								</p>
								<p className="text-2xl font-bold text-amber-700">
									{leaderboard[2].stats.won}
								</p>
								<p className="text-xs text-amber-600">wins</p>
							</div>
						</div>
					</div>
				)}

				{/* Full Leaderboard */}
				<div className="bg-white rounded-xl shadow-md overflow-hidden">
					<div className="p-4 border-b bg-gray-50">
						<h2 className="font-semibold text-gray-800">
							{leaderboardType === "friends" ? "Friends" : "All Players"} Rankings
						</h2>
					</div>

					<div className="divide-y">
						{leaderboard.map((user, index) => {
							const isCurrentUser = user.id === currentUser.id;
							const displayRank = index + 1;

							return (
								<div
									key={user.id}
									className={`flex items-center gap-4 p-4 ${
										isCurrentUser ? "bg-purple-50" : ""
									} ${getRankBgColor(displayRank)} border-l-4`}
								>
									<div className="w-8 flex justify-center">
										{getRankIcon(displayRank)}
									</div>

									<img
										src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
										alt={user.displayName}
										className="w-12 h-12 rounded-full bg-gray-200"
									/>

									<div className="flex-1 min-w-0">
										<p className="font-semibold text-gray-800 truncate">
											{user.displayName}
											{isCurrentUser && (
												<span className="ml-2 text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
													You
												</span>
											)}
										</p>
										<p className="text-sm text-gray-500">@{user.username}</p>
									</div>

									<div className="text-right">
										<p className="text-lg font-bold text-gray-800">
											{user.stats.won}
											<span className="text-sm font-normal text-gray-500 ml-1">
												wins
											</span>
										</p>
										<div className="flex items-center gap-1 text-sm text-gray-500">
											<TrendingUp
												size={14}
												className={
													user.stats.winRate >= 50
														? "text-green-500"
														: "text-red-500"
												}
											/>
											{user.stats.winRate}% win rate
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{leaderboard.length === 0 && (
					<div className="bg-white rounded-xl shadow-md p-12 text-center">
						<Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
						<h3 className="text-lg font-medium text-gray-800 mb-2">
							No rankings yet
						</h3>
						<p className="text-gray-500">
							{leaderboardType === "friends"
								? "Add friends and start betting to see rankings!"
								: "Start betting to appear on the leaderboard!"}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
