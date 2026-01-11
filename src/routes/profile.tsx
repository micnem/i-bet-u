import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useUser, useClerk } from "@clerk/tanstack-react-start";
import {
	User,
	Trophy,
	TrendingUp,
	TrendingDown,
	Settings,
	LogOut,
	ChevronRight,
	Loader2,
	DollarSign,
} from "lucide-react";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
	const router = useRouter();
	const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
	const { signOut } = useClerk();

	useEffect(() => {
		if (clerkLoaded && !clerkUser) {
			router.navigate({ to: "/auth/login" });
		}
	}, [clerkUser, clerkLoaded, router]);

	const handleLogout = async () => {
		await signOut();
		router.navigate({ to: "/" });
	};

	if (!clerkLoaded) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<Loader2 className="w-8 h-8 animate-spin text-orange-500" />
			</div>
		);
	}

	if (!clerkUser) {
		return null;
	}

	// Use Clerk user data directly
	const displayName = clerkUser.fullName || clerkUser.firstName || "User";
	const username = clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] || "user";
	const email = clerkUser.primaryEmailAddress?.emailAddress || "";
	const avatarUrl = clerkUser.imageUrl;

	// Stats will be 0 until synced via webhook and fetched from Supabase
	const totalBets = 0;
	const betsWon = 0;
	const betsLost = 0;
	const winRate = 0;

	// Amounts owed (calculated from completed bets)
	// TODO: Fetch from getAmountsOwedSummary API
	const totalWon = 0;
	const totalLost = 0;
	const netBalance = 0;

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header */}
			<div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-8 px-6">
				<div className="max-w-4xl mx-auto">
					<div className="flex items-center gap-4">
						<img
							src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
							alt={displayName}
							className="w-20 h-20 rounded-full bg-white/20"
						/>
						<div>
							<h1 className="text-2xl font-bold">{displayName}</h1>
							<p className="text-orange-100">@{username}</p>
							<p className="text-orange-100 text-sm">{email}</p>
						</div>
					</div>

					{/* Stats */}
					<div className="grid grid-cols-4 gap-4 mt-8">
						<div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center">
							<p className="text-3xl font-bold">{totalBets}</p>
							<p className="text-sm text-orange-100">Total Bets</p>
						</div>
						<div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center">
							<p className="text-3xl font-bold">{betsWon}</p>
							<p className="text-sm text-orange-100">Won</p>
						</div>
						<div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center">
							<p className="text-3xl font-bold">{betsLost}</p>
							<p className="text-sm text-orange-100">Lost</p>
						</div>
						<div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center">
							<p className="text-3xl font-bold">{winRate}%</p>
							<p className="text-sm text-orange-100">Win Rate</p>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-4xl mx-auto px-6 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Net Balance Section */}
					<div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
						<div className="flex items-center gap-3 mb-6">
							<div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
								<DollarSign className="w-5 h-5 text-orange-500" />
							</div>
							<div>
								<h2 className="text-lg font-semibold">Bet Balance</h2>
								<p className="text-sm text-gray-500">Your overall betting balance</p>
							</div>
						</div>

						<div className="grid grid-cols-3 gap-4">
							<div className="bg-green-50 rounded-xl p-4 text-center">
								<div className="flex items-center justify-center gap-2 mb-2">
									<TrendingUp className="w-5 h-5 text-green-600" />
									<span className="text-sm text-green-600 font-medium">Won</span>
								</div>
								<p className="text-2xl font-bold text-green-700">
									${totalWon.toFixed(2)}
								</p>
							</div>
							<div className="bg-red-50 rounded-xl p-4 text-center">
								<div className="flex items-center justify-center gap-2 mb-2">
									<TrendingDown className="w-5 h-5 text-red-600" />
									<span className="text-sm text-red-600 font-medium">Lost</span>
								</div>
								<p className="text-2xl font-bold text-red-700">
									${totalLost.toFixed(2)}
								</p>
							</div>
							<div className={`rounded-xl p-4 text-center ${netBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
								<div className="flex items-center justify-center gap-2 mb-2">
									<DollarSign className={`w-5 h-5 ${netBalance >= 0 ? 'text-green-700' : 'text-red-700'}`} />
									<span className={`text-sm font-medium ${netBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>Net</span>
								</div>
								<p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-800' : 'text-red-800'}`}>
									{netBalance >= 0 ? '+' : ''}{netBalance.toFixed(2)}
								</p>
							</div>
						</div>
					</div>

					{/* Amounts Owed Section */}
					<div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
						<div className="flex items-center gap-3 mb-6">
							<div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
								<Trophy className="w-5 h-5 text-blue-500" />
							</div>
							<div>
								<h2 className="text-lg font-semibold">Amounts Owed</h2>
								<p className="text-sm text-gray-500">Settle up with your friends</p>
							</div>
						</div>

						<div className="text-center py-8 text-gray-500">
							<Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
							<p>No completed bets yet</p>
							<p className="text-sm mt-2">Complete some bets to see amounts owed</p>
						</div>
					</div>

					{/* Account Settings */}
					<div className="lg:col-span-2 bg-white rounded-xl shadow-md overflow-hidden">
						<button
							type="button"
							className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
						>
							<div className="flex items-center gap-3">
								<Settings className="w-5 h-5 text-gray-600" />
								<span className="font-medium">Account Settings</span>
							</div>
							<ChevronRight className="w-5 h-5 text-gray-400" />
						</button>
						<button
							type="button"
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
		</div>
	);
}
