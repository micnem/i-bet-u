import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/tanstack-react-start";
import {
	User,
	Wallet,
	CreditCard,
	Plus,
	Trophy,
	TrendingUp,
	Settings,
	LogOut,
	ChevronRight,
	Loader2,
} from "lucide-react";
import { syncCurrentUser, getCurrentUser } from "../api/auth";
import type { User as DBUser } from "../lib/database.types";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
	const router = useRouter();
	const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
	const { signOut } = useClerk();
	const [user, setUser] = useState<DBUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadUser() {
			if (!clerkLoaded) return;

			if (!clerkUser) {
				router.navigate({ to: "/auth/login" });
				return;
			}

			setLoading(true);
			try {
				let result = await getCurrentUser();
				if (!result.data) {
					result = await syncCurrentUser();
				}
				if (result.data) {
					setUser(result.data);
				}
			} finally {
				setLoading(false);
			}
		}

		loadUser();
	}, [clerkUser, clerkLoaded, router]);

	const handleLogout = async () => {
		await signOut();
		router.navigate({ to: "/" });
	};

	if (!clerkLoaded || loading) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<Loader2 className="w-8 h-8 animate-spin text-orange-500" />
			</div>
		);
	}

	if (!user) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<p className="text-gray-600">Unable to load profile</p>
			</div>
		);
	}

	const winRate = user.total_bets > 0
		? Math.round((user.bets_won / user.total_bets) * 100)
		: 0;

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header */}
			<div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-8 px-6">
				<div className="max-w-4xl mx-auto">
					<div className="flex items-center gap-4">
						<img
							src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
							alt={user.display_name}
							className="w-20 h-20 rounded-full bg-white/20"
						/>
						<div>
							<h1 className="text-2xl font-bold">{user.display_name}</h1>
							<p className="text-orange-100">@{user.username}</p>
							<p className="text-orange-100 text-sm">{user.email}</p>
						</div>
					</div>

					{/* Stats */}
					<div className="grid grid-cols-4 gap-4 mt-8">
						<div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center">
							<p className="text-3xl font-bold">{user.total_bets}</p>
							<p className="text-sm text-orange-100">Total Bets</p>
						</div>
						<div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center">
							<p className="text-3xl font-bold">{user.bets_won}</p>
							<p className="text-sm text-orange-100">Won</p>
						</div>
						<div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center">
							<p className="text-3xl font-bold">{user.bets_lost}</p>
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
								${user.wallet_balance.toFixed(2)}
							</p>
						</div>

						<div className="flex gap-3">
							<button
								type="button"
								className="flex-1 ibetu-btn-primary flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
								disabled
							>
								<Plus size={20} />
								Add Funds
							</button>
						</div>
						<p className="text-xs text-gray-500 text-center mt-2">Coming soon</p>
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

						<div className="text-center py-8 text-gray-500">
							<CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
							<p>No payment methods yet</p>
							<p className="text-sm">Coming soon</p>
						</div>
					</div>

					{/* Transaction History */}
					<div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
						<div className="flex items-center gap-3 mb-6">
							<div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
								<TrendingUp className="w-5 h-5 text-green-500" />
							</div>
							<div>
								<h2 className="text-lg font-semibold">Transaction History</h2>
								<p className="text-sm text-gray-500">Recent wallet activity</p>
							</div>
						</div>

						<div className="text-center py-8 text-gray-500">
							<TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
							<p>No transactions yet</p>
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
