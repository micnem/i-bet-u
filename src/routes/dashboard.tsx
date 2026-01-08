import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Wallet,
	Trophy,
	Users,
	Plus,
	Clock,
	CheckCircle,
	XCircle,
	ArrowRight,
	Bell,
	TrendingUp,
} from "lucide-react";
import {
	currentUser,
	mockBets,
	mockBetInvites,
	mockFriends,
	getUserById,
} from "../data/mockData";
import type { Bet, BetInvite } from "../data/types";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
	const user = currentUser;
	const activeBets = mockBets.filter(
		(b) =>
			(b.creatorId === user.id || b.opponentId === user.id) &&
			b.status === "active"
	);
	const pendingInvites = mockBetInvites.filter(
		(i) => i.receiverId === user.id && i.status === "pending"
	);
	const recentBets = mockBets
		.filter((b) => b.creatorId === user.id || b.opponentId === user.id)
		.slice(0, 5);

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header Stats */}
			<div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-8 px-6">
				<div className="max-w-6xl mx-auto">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						<div>
							<h1 className="text-2xl font-bold">
								Welcome back, {user.displayName}!
							</h1>
							<p className="text-orange-100">@{user.username}</p>
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
								<Wallet className="w-8 h-8" />
								<div>
									<p className="text-sm text-orange-100">Wallet Balance</p>
									<p className="text-2xl font-bold">
										${user.walletBalance.toFixed(2)}
									</p>
								</div>
							</div>
						</div>
						<div className="bg-white/20 backdrop-blur rounded-lg p-4">
							<div className="flex items-center gap-3">
								<Trophy className="w-8 h-8" />
								<div>
									<p className="text-sm text-orange-100">Win Rate</p>
									<p className="text-2xl font-bold">{user.stats.winRate}%</p>
								</div>
							</div>
						</div>
						<div className="bg-white/20 backdrop-blur rounded-lg p-4">
							<div className="flex items-center gap-3">
								<TrendingUp className="w-8 h-8" />
								<div>
									<p className="text-sm text-orange-100">Total Bets</p>
									<p className="text-2xl font-bold">{user.stats.totalBets}</p>
								</div>
							</div>
						</div>
						<div className="bg-white/20 backdrop-blur rounded-lg p-4">
							<div className="flex items-center gap-3">
								<Users className="w-8 h-8" />
								<div>
									<p className="text-sm text-orange-100">Friends</p>
									<p className="text-2xl font-bold">{mockFriends.length}</p>
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
						{/* Pending Invites */}
						{pendingInvites.length > 0 && (
							<div className="bg-white rounded-xl shadow-md p-6">
								<div className="flex items-center justify-between mb-4">
									<h2 className="text-lg font-bold flex items-center gap-2">
										<Bell className="text-orange-500" size={20} />
										Bet Invites
										<span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
											{pendingInvites.length}
										</span>
									</h2>
								</div>
								<div className="space-y-3">
									{pendingInvites.map((invite) => (
										<BetInviteCard key={invite.id} invite={invite} />
									))}
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
									className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1"
								>
									View All <ArrowRight size={16} />
								</Link>
							</div>
							{activeBets.length > 0 ? (
								<div className="space-y-3">
									{activeBets.map((bet) => (
										<BetCard key={bet.id} bet={bet} currentUserId={user.id} />
									))}
								</div>
							) : (
								<div className="text-center py-8 text-gray-500">
									<Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
									<p>No active bets</p>
									<Link
										to="/bets/create"
										className="text-orange-500 hover:text-orange-600 font-medium"
									>
										Create your first bet
									</Link>
								</div>
							)}
						</div>

						{/* Recent Activity */}
						<div className="bg-white rounded-xl shadow-md p-6">
							<h2 className="text-lg font-bold mb-4">Recent Activity</h2>
							<div className="space-y-3">
								{recentBets.map((bet) => (
									<div
										key={bet.id}
										className="flex items-center justify-between py-3 border-b last:border-0"
									>
										<div className="flex items-center gap-3">
											<div
												className={`w-10 h-10 rounded-full flex items-center justify-center ${
													bet.status === "completed"
														? bet.winnerId === user.id
															? "bg-green-100"
															: "bg-red-100"
														: "bg-orange-100"
												}`}
											>
												{bet.status === "completed" ? (
													bet.winnerId === user.id ? (
														<CheckCircle className="w-5 h-5 text-green-600" />
													) : (
														<XCircle className="w-5 h-5 text-red-600" />
													)
												) : (
													<Clock className="w-5 h-5 text-orange-600" />
												)}
											</div>
											<div>
												<p className="font-medium text-gray-800">{bet.title}</p>
												<p className="text-sm text-gray-500">
													vs{" "}
													{bet.creatorId === user.id
														? bet.opponent?.displayName
														: bet.creator?.displayName}
												</p>
											</div>
										</div>
										<div className="text-right">
											<p
												className={`font-bold ${
													bet.status === "completed"
														? bet.winnerId === user.id
															? "text-green-600"
															: "text-red-600"
														: "text-gray-800"
												}`}
											>
												${bet.amount}
											</p>
											<p className="text-xs text-gray-500 capitalize">
												{bet.status}
											</p>
										</div>
									</div>
								))}
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
										<Wallet className="w-5 h-5 text-white" />
									</div>
									<div>
										<p className="font-medium text-gray-800">Add Funds</p>
										<p className="text-sm text-gray-500">Top up your wallet</p>
									</div>
								</Link>
							</div>
						</div>

						{/* Friends */}
						<div className="bg-white rounded-xl shadow-md p-6">
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-lg font-bold">Friends</h2>
								<Link
									to="/friends"
									className="text-orange-500 hover:text-orange-600 text-sm font-medium"
								>
									View All
								</Link>
							</div>
							<div className="space-y-3">
								{mockFriends.slice(0, 4).map((friend) => (
									<div
										key={friend.id}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-3">
											<img
												src={friend.user.avatar}
												alt={friend.user.displayName}
												className="w-10 h-10 rounded-full bg-gray-200"
											/>
											<div>
												<p className="font-medium text-gray-800">
													{friend.user.displayName}
												</p>
												<p className="text-sm text-gray-500">
													@{friend.user.username}
												</p>
											</div>
										</div>
										<Link
											to="/bets/create"
											search={{ friendId: friend.user.id }}
											className="text-orange-500 hover:text-orange-600"
										>
											<Plus size={20} />
										</Link>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function BetCard({ bet, currentUserId }: { bet: Bet; currentUserId: string }) {
	const isCreator = bet.creatorId === currentUserId;
	const opponent = isCreator ? bet.opponent : bet.creator;

	return (
		<Link
			to="/bets/$betId"
			params={{ betId: bet.id }}
			className="block p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all"
		>
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<h3 className="font-semibold text-gray-800">{bet.title}</h3>
					<p className="text-sm text-gray-500 mt-1">
						vs {opponent?.displayName}
					</p>
				</div>
				<div className="text-right">
					<p className="text-lg font-bold text-orange-500">${bet.amount}</p>
					<p className="text-xs text-gray-500">
						{new Date(bet.deadline).toLocaleDateString()}
					</p>
				</div>
			</div>
			<div className="flex items-center gap-2 mt-3">
				<span className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full capitalize">
					{bet.verificationMethod.replace("_", " ")}
				</span>
			</div>
		</Link>
	);
}

function BetInviteCard({ invite }: { invite: BetInvite }) {
	const sender = getUserById(invite.senderId);

	return (
		<div className="p-4 rounded-lg border-2 border-orange-200 bg-orange-50">
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<div className="flex items-center gap-2">
						<img
							src={sender?.avatar}
							alt={sender?.displayName}
							className="w-8 h-8 rounded-full bg-gray-200"
						/>
						<span className="font-medium text-gray-800">
							{sender?.displayName}
						</span>
					</div>
					<h3 className="font-semibold text-gray-800 mt-2">
						{invite.bet.title}
					</h3>
					<p className="text-sm text-gray-600 mt-1">{invite.bet.description}</p>
				</div>
				<p className="text-lg font-bold text-orange-500">
					${invite.bet.amount}
				</p>
			</div>
			<div className="flex gap-2 mt-4">
				<Link
					to="/bets/$betId"
					params={{ betId: invite.bet.id }}
					className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium text-center hover:bg-orange-600 transition-colors"
				>
					View & Accept
				</Link>
				<button className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">
					Decline
				</button>
			</div>
		</div>
	);
}
