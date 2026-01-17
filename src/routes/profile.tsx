import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useUser, useAuth } from "../components/AuthProvider";
import {
	Trophy,
	TrendingUp,
	TrendingDown,
	Settings,
	LogOut,
	ChevronRight,
	Loader2,
	DollarSign,
	Bell,
	Check,
	Clock,
	Pencil,
	X,
} from "lucide-react";
import { getAmountsOwedSummary } from "../api/bets";
import { sendPaymentReminder, canSendReminder } from "../api/reminders";
import { getCurrentUserProfile, updateUserProfile } from "../api/users";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

interface FriendBalance {
	friend: {
		id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
	amount: number;
}

interface AmountsData {
	totalWon: number;
	totalLost: number;
	netBalance: number;
	friendBalances: FriendBalance[];
}

function ProfilePage() {
	const router = useRouter();
	const { user, isSignedIn, isLoaded } = useUser();
	const { signOut } = useAuth();

	const [amountsData, setAmountsData] = useState<AmountsData | null>(null);
	const [userStats, setUserStats] = useState<{ total_bets: number; bets_won: number; bets_lost: number } | null>(null);
	const [loadingAmounts, setLoadingAmounts] = useState(true);
	const [sendingReminder, setSendingReminder] = useState<string | null>(null);
	const [reminderSent, setReminderSent] = useState<Record<string, boolean>>({});
	const [reminderError, setReminderError] = useState<string | null>(null);

	// Profile editing state
	const [isEditingName, setIsEditingName] = useState(false);
	const [editDisplayName, setEditDisplayName] = useState("");
	const [savingName, setSavingName] = useState(false);
	const [nameError, setNameError] = useState<string | null>(null);
	const [supabaseDisplayName, setSupabaseDisplayName] = useState<string | null>(null);

	useEffect(() => {
		if (isLoaded && !isSignedIn) {
			router.navigate({ to: "/auth/login" });
		}
	}, [isSignedIn, isLoaded, router]);

	useEffect(() => {
		async function fetchData() {
			try {
				const [amountsResult, profileResult] = await Promise.all([
					getAmountsOwedSummary(),
					getCurrentUserProfile(),
				]);
				if (amountsResult.data) {
					setAmountsData(amountsResult.data);
				}
				if (profileResult.data) {
					setUserStats({
						total_bets: profileResult.data.total_bets,
						bets_won: profileResult.data.bets_won,
						bets_lost: profileResult.data.bets_lost,
					});
					setSupabaseDisplayName(profileResult.data.display_name);
				}
			} catch (error) {
				console.error("Failed to fetch data:", error);
			} finally {
				setLoadingAmounts(false);
			}
		}

		if (isSignedIn) {
			fetchData();
		}
	}, [isSignedIn]);

	const handleLogout = async () => {
		await signOut();
		router.navigate({ to: "/" });
	};

	const handleSendReminder = async (friend: FriendBalance["friend"], amount: number) => {
		setSendingReminder(friend.id);
		setReminderError(null);

		try {
			// Check if we can send a reminder
			const canSend = await canSendReminder({ data: { friendId: friend.id } });
			if (!canSend.canSend) {
				setReminderError("You already sent a reminder in the last 24 hours");
				setSendingReminder(null);
				return;
			}

			// Send the reminder
			const result = await sendPaymentReminder({
				data: {
					friendId: friend.id,
					amount: Math.abs(amount),
					friendName: friend.display_name,
				},
			});

			if (result.error) {
				setReminderError(result.error);
			} else {
				setReminderSent((prev) => ({ ...prev, [friend.id]: true }));
				// Reset the "sent" state after 3 seconds
				setTimeout(() => {
					setReminderSent((prev) => ({ ...prev, [friend.id]: false }));
				}, 3000);
			}
		} catch (error) {
			setReminderError("Failed to send reminder");
		} finally {
			setSendingReminder(null);
		}
	};

	const handleStartEditName = () => {
		const fallbackName = user?.firstName
			? `${user.firstName} ${user.lastName || ""}`.trim()
			: "";
		setEditDisplayName(supabaseDisplayName || fallbackName || "");
		setIsEditingName(true);
		setNameError(null);
	};

	const handleCancelEditName = () => {
		setIsEditingName(false);
		setEditDisplayName("");
		setNameError(null);
	};

	const handleSaveName = async () => {
		const trimmedName = editDisplayName.trim();
		if (!trimmedName) {
			setNameError("Display name cannot be empty");
			return;
		}
		if (trimmedName.length < 2) {
			setNameError("Display name must be at least 2 characters");
			return;
		}
		if (trimmedName.length > 100) {
			setNameError("Display name must be less than 100 characters");
			return;
		}

		setSavingName(true);
		setNameError(null);

		try {
			const result = await updateUserProfile({ data: { displayName: trimmedName } });
			if (result.error) {
				setNameError(result.error);
			} else {
				setSupabaseDisplayName(trimmedName);
				setIsEditingName(false);
				setEditDisplayName("");
			}
		} catch (error) {
			console.error("Failed to update display name:", error);
			setNameError(error instanceof Error ? error.message : "Failed to update display name");
		} finally {
			setSavingName(false);
		}
	};

	if (!isLoaded) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<Loader2 className="w-8 h-8 animate-spin text-orange-500" />
			</div>
		);
	}

	if (!isSignedIn || !user) {
		return null;
	}

	// Use Supabase display name if available, otherwise fall back to AuthProvider data
	const displayName = supabaseDisplayName || (user.firstName
		? `${user.firstName} ${user.lastName || ""}`.trim()
		: "User");
	const username = user.username || user.primaryEmailAddress?.emailAddress?.split("@")[0] || "user";
	const email = user.primaryEmailAddress?.emailAddress || "";
	const avatarUrl = user.imageUrl;

	// Stats from Supabase
	const totalBets = userStats?.total_bets ?? 0;
	const betsWon = userStats?.bets_won ?? 0;
	const betsLost = userStats?.bets_lost ?? 0;
	const winRate = totalBets > 0 ? Math.round((betsWon / totalBets) * 100) : 0;

	// Amounts from API or defaults
	const totalWon = amountsData?.totalWon ?? 0;
	const totalLost = amountsData?.totalLost ?? 0;
	const netBalance = amountsData?.netBalance ?? 0;
	const friendBalances = amountsData?.friendBalances ?? [];

	// Separate friends who owe you vs friends you owe
	const friendsWhoOweYou = friendBalances.filter((f) => f.amount > 0);
	const friendsYouOwe = friendBalances.filter((f) => f.amount < 0);

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
						<div className="flex-1">
							{isEditingName ? (
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<input
											type="text"
											value={editDisplayName}
											onChange={(e) => setEditDisplayName(e.target.value)}
											className="px-3 py-1.5 rounded-lg text-gray-800 text-lg font-semibold w-48 focus:outline-none focus:ring-2 focus:ring-white/50"
											placeholder="Display name"
											disabled={savingName}
											autoFocus
											onKeyDown={(e) => {
												if (e.key === "Enter") handleSaveName();
												if (e.key === "Escape") handleCancelEditName();
											}}
										/>
										<button
											type="button"
											onClick={handleSaveName}
											disabled={savingName}
											className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
											title="Save"
										>
											{savingName ? (
												<Loader2 className="w-5 h-5 animate-spin" />
											) : (
												<Check className="w-5 h-5" />
											)}
										</button>
										<button
											type="button"
											onClick={handleCancelEditName}
											disabled={savingName}
											className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
											title="Cancel"
										>
											<X className="w-5 h-5" />
										</button>
									</div>
									{nameError && (
										<p className="text-red-200 text-sm">{nameError}</p>
									)}
								</div>
							) : (
								<div className="flex items-center gap-2">
									<h1 className="text-2xl font-bold">{displayName}</h1>
									<button
										type="button"
										onClick={handleStartEditName}
										className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
										title="Edit display name"
									>
										<Pencil className="w-4 h-4" />
									</button>
								</div>
							)}
							<p className="text-orange-100">@{username}</p>
							<p className="text-orange-100 text-sm">{email}</p>
						</div>
					</div>

					{/* Stats */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-8">
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

						{loadingAmounts ? (
							<div className="flex justify-center py-8">
								<Loader2 className="w-8 h-8 animate-spin text-orange-500" />
							</div>
						) : (
							<div className="grid grid-cols-3 gap-2 sm:gap-4">
								<div className="bg-green-50 rounded-xl p-2 sm:p-4 text-center">
									<div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
										<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
										<span className="text-xs sm:text-sm text-green-600 font-medium">Won</span>
									</div>
									<p className="text-lg sm:text-2xl font-bold text-green-700">
										${totalWon.toFixed(2)}
									</p>
								</div>
								<div className="bg-red-50 rounded-xl p-2 sm:p-4 text-center">
									<div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
										<TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
										<span className="text-xs sm:text-sm text-red-600 font-medium">Lost</span>
									</div>
									<p className="text-lg sm:text-2xl font-bold text-red-700">
										${totalLost.toFixed(2)}
									</p>
								</div>
								<div className={`rounded-xl p-2 sm:p-4 text-center ${netBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
									<div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
										<DollarSign className={`w-4 h-4 sm:w-5 sm:h-5 ${netBalance >= 0 ? 'text-green-700' : 'text-red-700'}`} />
										<span className={`text-xs sm:text-sm font-medium ${netBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>Net</span>
									</div>
									<p className={`text-lg sm:text-2xl font-bold ${netBalance >= 0 ? 'text-green-800' : 'text-red-800'}`}>
										{netBalance >= 0 ? '+' : ''}{netBalance.toFixed(2)}
									</p>
								</div>
							</div>
						)}
					</div>

					{/* Friends Who Owe You Section */}
					<div className="bg-white rounded-xl shadow-md p-6">
						<div className="flex items-center gap-3 mb-6">
							<div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
								<TrendingUp className="w-5 h-5 text-green-500" />
							</div>
							<div>
								<h2 className="text-lg font-semibold">Owed to You</h2>
								<p className="text-sm text-gray-500">Friends who owe you money</p>
							</div>
						</div>

						{reminderError && (
							<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
								{reminderError}
								<button
									type="button"
									onClick={() => setReminderError(null)}
									className="ml-2 text-red-500 hover:text-red-700"
								>
									Dismiss
								</button>
							</div>
						)}

						{loadingAmounts ? (
							<div className="flex justify-center py-8">
								<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
							</div>
						) : friendsWhoOweYou.length === 0 ? (
							<div className="text-center py-8 text-gray-500">
								<Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
								<p>No one owes you money</p>
								<p className="text-sm mt-2">Win some bets to change that!</p>
							</div>
						) : (
							<div className="space-y-3">
								{friendsWhoOweYou.map((fb) => (
									<div
										key={fb.friend.id}
										className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-green-50 rounded-lg gap-2 sm:gap-3"
									>
										<div className="flex items-center gap-2 sm:gap-3 min-w-0">
											<img
												src={fb.friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fb.friend.username}`}
												alt={fb.friend.display_name}
												className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
											/>
											<div className="min-w-0">
												<p className="font-medium text-gray-800 text-sm sm:text-base truncate">{fb.friend.display_name}</p>
												<p className="text-xs sm:text-sm text-gray-500 truncate">@{fb.friend.username}</p>
											</div>
										</div>
										<div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 ml-10 sm:ml-0">
											<span className="font-bold text-green-700 text-sm sm:text-base">${fb.amount.toFixed(2)}</span>
											<button
												type="button"
												onClick={() => handleSendReminder(fb.friend, fb.amount)}
												disabled={sendingReminder === fb.friend.id || reminderSent[fb.friend.id]}
												className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex-shrink-0 ${
													reminderSent[fb.friend.id]
														? 'bg-green-500 text-white'
														: 'bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50'
												}`}
											>
												{sendingReminder === fb.friend.id ? (
													<Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
												) : reminderSent[fb.friend.id] ? (
													<>
														<Check className="w-3 h-3 sm:w-4 sm:h-4" />
														Sent
													</>
												) : (
													<>
														<Bell className="w-3 h-3 sm:w-4 sm:h-4" />
														Remind
													</>
												)}
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Friends You Owe Section */}
					<div className="bg-white rounded-xl shadow-md p-6">
						<div className="flex items-center gap-3 mb-6">
							<div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
								<TrendingDown className="w-5 h-5 text-red-500" />
							</div>
							<div>
								<h2 className="text-lg font-semibold">You Owe</h2>
								<p className="text-sm text-gray-500">Friends you owe money to</p>
							</div>
						</div>

						{loadingAmounts ? (
							<div className="flex justify-center py-8">
								<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
							</div>
						) : friendsYouOwe.length === 0 ? (
							<div className="text-center py-8 text-gray-500">
								<Check className="w-12 h-12 mx-auto mb-3 text-gray-300" />
								<p>You don't owe anyone</p>
								<p className="text-sm mt-2">Keep up the winning streak!</p>
							</div>
						) : (
							<div className="space-y-3">
								{friendsYouOwe.map((fb) => (
									<div
										key={fb.friend.id}
										className="flex items-center justify-between p-3 bg-red-50 rounded-lg gap-2 sm:gap-3"
									>
										<div className="flex items-center gap-2 sm:gap-3 min-w-0">
											<img
												src={fb.friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fb.friend.username}`}
												alt={fb.friend.display_name}
												className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
											/>
											<div className="min-w-0">
												<p className="font-medium text-gray-800 text-sm sm:text-base truncate">{fb.friend.display_name}</p>
												<p className="text-xs sm:text-sm text-gray-500 truncate">@{fb.friend.username}</p>
											</div>
										</div>
										<span className="font-bold text-red-700 text-sm sm:text-base flex-shrink-0">${Math.abs(fb.amount).toFixed(2)}</span>
									</div>
								))}
							</div>
						)}
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
