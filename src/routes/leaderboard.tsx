import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/leaderboard")({
	component: LeaderboardPage,
});

function LeaderboardPage() {
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
				<div className="bg-white rounded-xl shadow-md p-12 text-center">
					<Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
					<h3 className="text-lg font-medium text-gray-800 mb-2">
						No rankings yet
					</h3>
					<p className="text-gray-500">
						Start betting to appear on the leaderboard!
					</p>
				</div>
			</div>
		</div>
	);
}
