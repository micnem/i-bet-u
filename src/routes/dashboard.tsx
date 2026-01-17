import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useUser } from "../components/AuthProvider";
import {
	DollarSign,
	Trophy,
	Users,
	Plus,
	Clock,
	TrendingUp,
	Loader2,
	ChevronRight,
	AlertCircle,
	CheckCircle,
	XCircle,
	TimerOff,
	UserPlus,
	AtSign,
	Phone,
	QrCode,
	X,
	Share2,
	Copy,
	Check,
} from "lucide-react";
import { getUserBets, getAmountsOwedSummary, acceptBet, declineBet } from "../api/bets";
import { getCurrentUserProfile } from "../api/users";
import type { BetStatus } from "../lib/database.types";
import { getDisplayStatus, type DisplayStatus } from "../lib/bet-utils";
import { QRCodeDisplay } from "../components/QRCode";
import { generateFriendInviteLink, getFriendInviteShareData, shareLink, copyToClipboard } from "../lib/sharing";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

interface Bet {
	id: string;
	title: string;
	amount: number;
	status: BetStatus;
	deadline: string;
	creator_id: string;
	opponent_id: string;
	creator: {
		id: string;
		display_name: string;
		avatar_url: string | null;
	};
	opponent: {
		id: string;
		display_name: string;
		avatar_url: string | null;
	};
}

interface UserProfile {
	total_bets: number;
	bets_won: number;
	bets_lost: number;
}

type AddMethod = "qr" | "phone" | "nickname";

function Dashboard() {
	const { user, isSignedIn, isLoaded } = useUser();
	const router = useRouter();

	const [activeBets, setActiveBets] = useState<Bet[]>([]);
	const [pendingBets, setPendingBets] = useState<Bet[]>([]);
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [netBalance, setNetBalance] = useState(0);
	const [loading, setLoading] = useState(true);
	const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
	const [showAddFriendModal, setShowAddFriendModal] = useState(false);
	const [addMethod, setAddMethod] = useState<AddMethod>("qr");
	const [addInput, setAddInput] = useState("");
	const [linkCopied, setLinkCopied] = useState(false);

	useEffect(() => {
		if (isLoaded && !isSignedIn) {
			router.navigate({ to: "/auth/login" });
		}
	}, [isSignedIn, isLoaded, router]);

	const refreshBets = async () => {
		const betsResult = await getUserBets({ data: {} });
		if (betsResult.data) {
			const bets = betsResult.data as Bet[];
			setActiveBets(bets.filter((b) => b.status === "active").slice(0, 5));
			setPendingBets(bets.filter((b) => b.status === "pending").slice(0, 5));
		}
	};

	const handleAccept = async (e: React.MouseEvent, betId: string) => {
		e.preventDefault();
		e.stopPropagation();
		setActionLoadingId(betId);
		const result = await acceptBet({ data: { betId } });
		if (!result.error) {
			await refreshBets();
		}
		setActionLoadingId(null);
	};

	const handleDecline = async (e: React.MouseEvent, betId: string) => {
		e.preventDefault();
		e.stopPropagation();
		setActionLoadingId(betId);
		const result = await declineBet({ data: { betId } });
		if (!result.error) {
			await refreshBets();
		}
		setActionLoadingId(null);
	};

	useEffect(() => {
		async function fetchData() {
			if (!isSignedIn) return;

			setLoading(true);
			try {
				const [betsResult, amountsResult, profileResult] = await Promise.all([
					getUserBets({ data: {} }),
					getAmountsOwedSummary(),
					getCurrentUserProfile(),
				]);

				if (betsResult.data) {
					const bets = betsResult.data as Bet[];
					setActiveBets(bets.filter((b) => b.status === "active").slice(0, 5));
					setPendingBets(bets.filter((b) => b.status === "pending").slice(0, 5));
				}

				if (amountsResult.data) {
					setNetBalance(amountsResult.data.netBalance);
				}

				if (profileResult.data) {
					setProfile(profileResult.data as UserProfile);
				}
			} catch (error) {
				console.error("Failed to fetch dashboard data:", error);
			}
			setLoading(false);
		}

		if (isSignedIn) {
			fetchData();
		}
	}, [isSignedIn]);

	if (!isLoaded || loading) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
					<p className="mt-2 text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	if (!isSignedIn || !user) {
		return null;
	}

	const displayName = user.firstName
		? `${user.firstName} ${user.lastName || ""}`.trim()
		: "User";
	const username =
		user.username ||
		user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
		"user";
	const userId = user.id || "";

	const totalBets = profile?.total_bets ?? 0;
	const betsWon = profile?.bets_won ?? 0;
	const betsLost = profile?.bets_lost ?? 0;
	const winRate = totalBets > 0 ? Math.round((betsWon / totalBets) * 100) : 0;

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});
	};

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
						<div className="flex gap-3">
							<Link
								to="/bets/create"
								className="inline-flex items-center gap-2 px-4 py-2 bg-white text-orange-500 rounded-lg font-medium hover:bg-orange-50 transition-colors"
							>
								<Plus size={20} />
								New Bet
							</Link>
							<button
								type="button"
								onClick={() => setShowAddFriendModal(true)}
								className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors"
							>
								<UserPlus size={20} />
								Add Friend
							</button>
						</div>
					</div>

					{/* Stats Cards */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
						<div className="bg-white/20 backdrop-blur rounded-lg p-4">
							<div className="flex items-center gap-3">
								<DollarSign className="w-8 h-8" />
								<div>
									<p className="text-sm text-orange-100">Net Balance</p>
									<p className="text-2xl font-bold">
										{netBalance >= 0 ? "+" : "-"}${Math.abs(netBalance).toFixed(2)}
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
									<p className="text-2xl font-bold">
										{betsWon}W - {betsLost}L
									</p>
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
						{/* Pending Bets (requiring action) */}
						{pendingBets.length > 0 && (
							<div className="bg-white rounded-xl shadow-md p-6">
								<div className="flex items-center justify-between mb-4">
									<h2 className="text-lg font-bold flex items-center gap-2">
										<AlertCircle className="text-yellow-500" size={20} />
										Pending Bets
									</h2>
									<Link
										to="/bets"
										className="text-orange-500 hover:text-orange-600 text-sm font-medium"
									>
										View All
									</Link>
								</div>
								<div className="space-y-3">
									{pendingBets.map((bet) => {
										const displayStatus = getDisplayStatus(bet.status, bet.deadline);
										const isDeadlinePassed = displayStatus === "deadline_passed";
										const isPendingForMe =
											user?.id === bet.opponent.id && !isDeadlinePassed;
										const isActionLoading = actionLoadingId === bet.id;
										// Show opponent name if I'm the creator, show creator name if I'm the opponent
										const isOpponent = user?.id === bet.opponent.id;
										const otherPartyName = isOpponent
											? bet.creator.display_name
											: bet.opponent.display_name;

										return (
											<Link
												key={bet.id}
												to="/bets/$betId"
												params={{ betId: bet.id }}
												className={`block p-3 rounded-lg transition-colors ${
													isDeadlinePassed
														? "bg-red-50 hover:bg-red-100"
														: "bg-yellow-50 hover:bg-yellow-100"
												}`}
											>
												<div className="flex items-center justify-between">
													<div>
														<div className="flex items-center gap-2 mb-1">
															{isDeadlinePassed && (
																<span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 flex items-center gap-1">
																	<TimerOff className="w-3 h-3" />
																	Deadline Passed
																</span>
															)}
														</div>
														<p className="font-medium text-gray-800">{bet.title}</p>
														<p className="text-sm text-gray-500">
															vs {otherPartyName}
														</p>
													</div>
													<div className="flex items-center gap-3">
														<span className="font-bold text-orange-500">
															${bet.amount}
														</span>
														<ChevronRight className="w-5 h-5 text-gray-400" />
													</div>
												</div>
												{isPendingForMe && (
													<div className="flex gap-2 mt-3 pt-3 border-t border-yellow-200">
														<button
															type="button"
															onClick={(e) => handleAccept(e, bet.id)}
															disabled={isActionLoading}
															className="flex-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
														>
															{isActionLoading ? (
																<Loader2 className="w-4 h-4 animate-spin" />
															) : (
																<CheckCircle className="w-4 h-4" />
															)}
															Accept
														</button>
														<button
															type="button"
															onClick={(e) => handleDecline(e, bet.id)}
															disabled={isActionLoading}
															className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
														>
															<XCircle className="w-4 h-4" />
															Decline
														</button>
													</div>
												)}
											</Link>
										);
									})}
								</div>
							</div>
						)}

						{/* Active Bets */}
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
							{activeBets.length === 0 ? (
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
							) : (
								<div className="space-y-3">
									{activeBets.map((bet) => {
										const displayStatus = getDisplayStatus(bet.status, bet.deadline);
										const isDeadlinePassed = displayStatus === "deadline_passed";
										// Show the other party's name (creator if I'm opponent, opponent if I'm creator)
										const isOpponent = user?.id === bet.opponent.id;
										const otherPartyName = isOpponent
											? bet.creator.display_name
											: bet.opponent.display_name;

										return (
											<Link
												key={bet.id}
												to="/bets/$betId"
												params={{ betId: bet.id }}
												className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
													isDeadlinePassed
														? "bg-red-50 hover:bg-red-100"
														: "bg-gray-50 hover:bg-gray-100"
												}`}
											>
												<div>
													{isDeadlinePassed && (
														<span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 inline-flex items-center gap-1 mb-1">
															<TimerOff className="w-3 h-3" />
															Deadline Passed
														</span>
													)}
													<p className="font-medium text-gray-800">{bet.title}</p>
													<p className="text-sm text-gray-500">
														vs {otherPartyName} - Due{" "}
														{formatDate(bet.deadline)}
													</p>
												</div>
												<div className="flex items-center gap-3">
													<span className="font-bold text-orange-500">
														${bet.amount}
													</span>
													<ChevronRight className="w-5 h-5 text-gray-400" />
												</div>
											</Link>
										);
									})}
								</div>
							)}
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
										<p className="text-sm text-gray-500">Challenge a friend</p>
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

			{/* Add Friend Modal */}
			{showAddFriendModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-xl max-w-md w-full p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-bold text-gray-800">Add Friend</h2>
							<button
								type="button"
								onClick={() => {
									setShowAddFriendModal(false);
									setAddInput("");
								}}
								className="text-gray-400 hover:text-gray-600"
							>
								<X size={24} />
							</button>
						</div>

						{/* Method Tabs */}
						<div className="flex gap-2 mb-6">
							<button
								type="button"
								onClick={() => {
									setAddMethod("nickname");
									setAddInput("");
								}}
								className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
									addMethod === "nickname"
										? "bg-orange-500 text-white"
										: "bg-gray-100 text-gray-600 hover:bg-gray-200"
								}`}
							>
								<AtSign size={16} />
								Nickname
							</button>
							<button
								type="button"
								onClick={() => {
									setAddMethod("phone");
									setAddInput("");
								}}
								className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
									addMethod === "phone"
										? "bg-orange-500 text-white"
										: "bg-gray-100 text-gray-600 hover:bg-gray-200"
								}`}
							>
								<Phone size={16} />
								Phone
							</button>
							<button
								type="button"
								onClick={() => {
									setAddMethod("qr");
									setAddInput("");
								}}
								className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
									addMethod === "qr"
										? "bg-orange-500 text-white"
										: "bg-gray-100 text-gray-600 hover:bg-gray-200"
								}`}
							>
								<QrCode size={16} />
								QR Code
							</button>
						</div>

						{/* QR Code Display */}
						{addMethod === "qr" ? (
							<div className="py-2">
								{/* Prominent Share Button */}
								<button
									type="button"
									onClick={() => shareLink(getFriendInviteShareData(userId, displayName))}
									className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-lg transition-colors mb-4"
								>
									<Share2 size={24} />
									Share Invite Link
								</button>

								{/* Copy Link Section */}
								<div className="flex items-center gap-2 mb-4">
									<div className="flex-1 bg-gray-100 rounded-lg px-4 py-3 text-sm text-gray-600 truncate">
										{generateFriendInviteLink(userId)}
									</div>
									<button
										type="button"
										onClick={async () => {
											const success = await copyToClipboard(generateFriendInviteLink(userId));
											if (success) {
												setLinkCopied(true);
												setTimeout(() => setLinkCopied(false), 2000);
											}
										}}
										className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
											linkCopied
												? "bg-green-100 text-green-700"
												: "bg-gray-200 hover:bg-gray-300 text-gray-700"
										}`}
									>
										{linkCopied ? <Check size={18} /> : <Copy size={18} />}
										{linkCopied ? "Copied!" : "Copy"}
									</button>
								</div>

								{/* QR Code */}
								<div className="border-t pt-4">
									<p className="text-sm text-gray-500 text-center mb-3">Or scan QR code</p>
									<QRCodeDisplay
										value={generateFriendInviteLink(userId)}
										title=""
										description=""
										shareData={getFriendInviteShareData(userId, displayName)}
										size={160}
									/>
								</div>
							</div>
						) : (
							<>
								{/* Search Input */}
								<div className="relative mb-4">
									<input
										type={addMethod === "phone" ? "tel" : "text"}
										value={addInput}
										onChange={(e) => setAddInput(e.target.value)}
										placeholder={
											addMethod === "phone"
												? "Enter phone number"
												: "Enter username or name"
										}
										className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all pr-20"
									/>
									<button
										type="button"
										className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
									>
										Search
									</button>
								</div>

								<p className="text-center text-gray-400 py-4">
									{addMethod === "phone"
										? "Enter a phone number to find friends"
										: "Search by username or display name"}
								</p>
							</>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
