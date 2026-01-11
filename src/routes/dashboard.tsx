import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useUser } from "@clerk/tanstack-react-start";
import {
	DollarSign,
	Trophy,
	Users,
	Plus,
	Clock,
	TrendingUp,
	Loader2,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
	const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
	const router = useRouter();

	useEffect(() => {
		if (clerkLoaded && !clerkUser) {
			router.navigate({ to: "/auth/login" });
		}
	}, [clerkUser, clerkLoaded, router]);

	if (!clerkLoaded) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
					<p className="mt-2 text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	if (!clerkUser) {
		return null;
	}

	// Use Clerk user data directly
	const displayName = clerkUser.fullName || clerkUser.firstName || "User";
	const username = clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] || "user";

	// Stats will be 0 until synced via webhook and fetched from Supabase
	const totalBets = 0;
	const betsWon = 0;
	const betsLost = 0;
	const winRate = 0;

	// Net balance (calculated from completed bets)
	// TODO: Fetch from getAmountsOwedSummary API
	const netBalance = 0;

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header Stats */}
			<div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-8 px-6">
				<div className="max-w-6xl mx-auto">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						<div>
							<h1 className="text-2xl font-bold">
								Welcome back, {displayName}!
							</h1>
							<p className="text-orange-100">@{username}</p>
						</div>
						<div className="flex gap-4">
							<Link
								to="/bets/create"
								className="inline-flex items-center gap-2 px-4 py-2 bg-white text-orange-500 rounded-lg font-medium hover:bg-orange-50 transition-colors"
							>
								<Plus size={20} />
								New Bet
							</Link>
						</div>
					</div>

					{/* Stats Cards */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
						<div className="bg-white/20 backdrop-blur rounded-lg p-4">
							<div className="flex items-center gap-3">
								<DollarSign className="w-8 h-8" />
								<div>
									<p className="text-sm text-orange-100">Net Balance</p>
									<p className={`text-2xl font-bold ${netBalance >= 0 ? '' : ''}`}>
										{netBalance >= 0 ? '+' : ''}${Math.abs(netBalance).toFixed(2)}
									</p>
								</div>
							</div>
						</div>
						<div className="bg-white/20 backdrop-blur rounded-lg p-4">
							<div className="flex items-center gap-3">
								<Trophy className="w-8 h-8" />
								<div>
									<p className="text-sm text-orange-100">Win Rate</p>
									<p className="text-2xl font-bold">{winRate}%</p>
								</div>
							</div>
						</div>
						<div className="bg-white/20 backdrop-blur rounded-lg p-4">
							<div className="flex items-center gap-3">
								<TrendingUp className="w-8 h-8" />
								<div>
									<p className="text-sm text-orange-100">Total Bets</p>
									<p className="text-2xl font-bold">{totalBets}</p>
								</div>
							</div>
						</div>
						<div className="bg-white/20 backdrop-blur rounded-lg p-4">
							<div className="flex items-center gap-3">
								<Users className="w-8 h-8" />
								<div>
									<p className="text-sm text-orange-100">Record</p>
									<p className="text-2xl font-bold">{betsWon}W - {betsLost}L</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-6xl mx-auto px-6 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Main Content */}
					<div className="lg:col-span-2 space-y-6">
						{/* Active Bets Placeholder */}
						<div className="bg-white rounded-xl shadow-md p-6">
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-lg font-bold flex items-center gap-2">
									<Clock className="text-orange-500" size={20} />
									Active Bets
								</h2>
								<Link
									to="/bets"
									className="text-orange-500 hover:text-orange-600 text-sm font-medium"
								>
									View All
								</Link>
							</div>
							<div className="text-center py-8 text-gray-500">
								<Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
								<p>No active bets yet</p>
								<Link
									to="/bets/create"
									className="text-orange-500 hover:text-orange-600 font-medium"
								>
									Create your first bet
								</Link>
							</div>
						</div>
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Quick Actions */}
						<div className="bg-white rounded-xl shadow-md p-6">
							<h2 className="text-lg font-bold mb-4">Quick Actions</h2>
							<div className="space-y-3">
								<Link
									to="/bets/create"
									className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors"
								>
									<div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
										<Plus className="w-5 h-5 text-white" />
									</div>
									<div>
										<p className="font-medium text-gray-800">Create Bet</p>
										<p className="text-sm text-gray-500">
											Challenge a friend
										</p>
									</div>
								</Link>
								<Link
									to="/friends"
									className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
								>
									<div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
										<Users className="w-5 h-5 text-white" />
									</div>
									<div>
										<p className="font-medium text-gray-800">Add Friends</p>
										<p className="text-sm text-gray-500">QR, Phone, or Name</p>
									</div>
								</Link>
								<Link
									to="/profile"
									className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
								>
									<div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
										<DollarSign className="w-5 h-5 text-white" />
									</div>
									<div>
										<p className="font-medium text-gray-800">View Balance</p>
										<p className="text-sm text-gray-500">See amounts owed</p>
									</div>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
