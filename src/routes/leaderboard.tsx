import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Medal, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { getLeaderboard } from "../api/social";

export const Route = createFileRoute("/leaderboard")({
	component: LeaderboardPage,
});

interface LeaderboardEntry {
	rank: number;
	id: string;
	username: string;
	displayName: string;
	avatarUrl: string | null;
	wins: number;
	losses: number;
	totalBets: number;
	winRate: number;
}

function LeaderboardPage() {
	const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchLeaderboard() {
			setLoading(true);
			const result = await getLeaderboard({ data: { limit: 50 } });
			if (!result.error && result.data) {
				setLeaderboard(result.data as LeaderboardEntry[]);
			}
			setLoading(false);
		}
		fetchLeaderboard();
	}, []);

	const getRankBadge = (rank: number) => {
		if (rank === 1) {
			return (
				<div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
					<Trophy className="w-4 h-4 text-yellow-800" />
				</div>
			);
		}
		if (rank === 2) {
			return (
				<div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
					<Medal className="w-4 h-4 text-gray-600" />
				</div>
			);
		}
		if (rank === 3) {
			return (
				<div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
					<Medal className="w-4 h-4 text-amber-200" />
				</div>
			);
		}
		return (
			<div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
				<span className="text-sm font-bold text-gray-600">{rank}</span>
			</div>
		);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<Loader2 className="w-8 h-8 animate-spin text-orange-500" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header */}
			<div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-8 px-6">
				<div className="max-w-4xl mx-auto">
					<h1 className="text-2xl font-bold flex items-center gap-2">
						<Trophy className="w-8 h-8" />
						Leaderboard
					</h1>
					<p className="text-purple-200">See who's winning the most bets</p>
				</div>
			</div>

			<div className="max-w-4xl mx-auto px-6 py-8">
				{leaderboard.length === 0 ? (
					<div className="bg-white rounded-xl shadow-md p-12 text-center">
						<Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
						<h3 className="text-lg font-medium text-gray-800 mb-2">
							No rankings yet
						</h3>
						<p className="text-gray-500">
							Start betting to appear on the leaderboard!
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{/* Top 3 Cards */}
						{leaderboard.length >= 3 && (
							<div className="grid grid-cols-3 gap-4 mb-8">
								{/* 2nd Place */}
								<div className="bg-white rounded-xl shadow-md p-4 text-center order-1">
									<div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
										<Medal className="w-6 h-6 text-gray-600" />
									</div>
									<div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-2">
										{leaderboard[1].avatarUrl ? (
											<img
												src={leaderboard[1].avatarUrl}
												alt={leaderboard[1].displayName}
												className="w-full h-full object-cover"
											/>
										) : (
											<span className="text-xl font-bold text-white">
												{leaderboard[1].displayName.charAt(0).toUpperCase()}
											</span>
										)}
									</div>
									<p className="font-semibold text-gray-800 truncate">
										{leaderboard[1].displayName}
									</p>
									<p className="text-sm text-gray-500">
										{leaderboard[1].wins} wins
									</p>
									<p className="text-xs text-gray-400">
										{leaderboard[1].winRate}% win rate
									</p>
								</div>

								{/* 1st Place */}
								<div className="bg-white rounded-xl shadow-md p-4 text-center order-0 transform scale-105 border-2 border-yellow-400">
									<div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-2">
										<Trophy className="w-6 h-6 text-yellow-800" />
									</div>
									<div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-2">
										{leaderboard[0].avatarUrl ? (
											<img
												src={leaderboard[0].avatarUrl}
												alt={leaderboard[0].displayName}
												className="w-full h-full object-cover"
											/>
										) : (
											<span className="text-2xl font-bold text-white">
												{leaderboard[0].displayName.charAt(0).toUpperCase()}
											</span>
										)}
									</div>
									<p className="font-bold text-gray-800 truncate">
										{leaderboard[0].displayName}
									</p>
									<p className="text-sm text-yellow-600 font-semibold">
										{leaderboard[0].wins} wins
									</p>
									<p className="text-xs text-gray-400">
										{leaderboard[0].winRate}% win rate
									</p>
								</div>

								{/* 3rd Place */}
								<div className="bg-white rounded-xl shadow-md p-4 text-center order-2">
									<div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
										<Medal className="w-6 h-6 text-amber-200" />
									</div>
									<div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-2">
										{leaderboard[2].avatarUrl ? (
											<img
												src={leaderboard[2].avatarUrl}
												alt={leaderboard[2].displayName}
												className="w-full h-full object-cover"
											/>
										) : (
											<span className="text-xl font-bold text-white">
												{leaderboard[2].displayName.charAt(0).toUpperCase()}
											</span>
										)}
									</div>
									<p className="font-semibold text-gray-800 truncate">
										{leaderboard[2].displayName}
									</p>
									<p className="text-sm text-gray-500">
										{leaderboard[2].wins} wins
									</p>
									<p className="text-xs text-gray-400">
										{leaderboard[2].winRate}% win rate
									</p>
								</div>
							</div>
						)}

						{/* Rest of leaderboard */}
						<div className="bg-white rounded-xl shadow-md overflow-hidden">
							<div className="divide-y">
								{leaderboard
									.slice(leaderboard.length >= 3 ? 3 : 0)
									.map((entry) => (
										<div
											key={entry.id}
											className="flex items-center justify-between p-4 hover:bg-gray-50"
										>
											<div className="flex items-center gap-4">
												{getRankBadge(entry.rank)}
												<div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
													{entry.avatarUrl ? (
														<img
															src={entry.avatarUrl}
															alt={entry.displayName}
															className="w-full h-full object-cover"
														/>
													) : (
														<span className="text-lg font-bold text-white">
															{entry.displayName.charAt(0).toUpperCase()}
														</span>
													)}
												</div>
												<div>
													<p className="font-medium text-gray-800">
														{entry.displayName}
													</p>
													{entry.username && (
														<p className="text-sm text-gray-500">
															@{entry.username}
														</p>
													)}
												</div>
											</div>
											<div className="text-right">
												<p className="font-bold text-gray-800">
													{entry.wins}W - {entry.losses}L
												</p>
												<p className="text-sm text-gray-500">
													{entry.winRate}% win rate
												</p>
											</div>
										</div>
									))}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
