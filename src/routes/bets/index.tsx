import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Clock,
	CheckCircle,
	XCircle,
	Trophy,
	Plus,
	Filter,
} from "lucide-react";
import { useState } from "react";
import { currentUser, mockBets } from "../../data/mockData";
import type { Bet, BetStatus } from "../../data/types";

export const Route = createFileRoute("/bets/")({ component: BetsPage });

type FilterType = "all" | "active" | "completed" | "pending";

function BetsPage() {
	const [filter, setFilter] = useState<FilterType>("all");
	const user = currentUser;

	const userBets = mockBets.filter(
		(b) => b.creatorId === user.id || b.opponentId === user.id
	);

	const filteredBets = userBets.filter((bet) => {
		if (filter === "all") return true;
		if (filter === "active") return bet.status === "active";
		if (filter === "completed") return bet.status === "completed";
		if (filter === "pending") return bet.status === "pending";
		return true;
	});

	const stats = {
		active: userBets.filter((b) => b.status === "active").length,
		completed: userBets.filter((b) => b.status === "completed").length,
		pending: userBets.filter((b) => b.status === "pending").length,
		won: userBets.filter((b) => b.winnerId === user.id).length,
		lost: userBets.filter(
			(b) => b.status === "completed" && b.winnerId !== user.id
		).length,
	};

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header */}
			<div className="bg-white shadow">
				<div className="max-w-4xl mx-auto px-6 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-800">My Bets</h1>
							<p className="text-gray-500">
								{userBets.length} total bets
							</p>
						</div>
						<Link
							to="/bets/create"
							className="ibetu-btn-primary inline-flex items-center gap-2"
						>
							<Plus size={20} />
							New Bet
						</Link>
					</div>

					{/* Stats */}
					<div className="grid grid-cols-3 md:grid-cols-5 gap-4 mt-6">
						<div className="bg-orange-50 rounded-lg p-3 text-center">
							<p className="text-2xl font-bold text-orange-500">{stats.active}</p>
							<p className="text-sm text-gray-600">Active</p>
						</div>
						<div className="bg-yellow-50 rounded-lg p-3 text-center">
							<p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
							<p className="text-sm text-gray-600">Pending</p>
						</div>
						<div className="bg-gray-50 rounded-lg p-3 text-center">
							<p className="text-2xl font-bold text-gray-500">{stats.completed}</p>
							<p className="text-sm text-gray-600">Completed</p>
						</div>
						<div className="bg-green-50 rounded-lg p-3 text-center">
							<p className="text-2xl font-bold text-green-500">{stats.won}</p>
							<p className="text-sm text-gray-600">Won</p>
						</div>
						<div className="bg-red-50 rounded-lg p-3 text-center">
							<p className="text-2xl font-bold text-red-500">{stats.lost}</p>
							<p className="text-sm text-gray-600">Lost</p>
						</div>
					</div>
				</div>
			</div>

			{/* Filter Tabs */}
			<div className="max-w-4xl mx-auto px-6 py-4">
				<div className="flex gap-2 overflow-x-auto pb-2">
					{(["all", "active", "pending", "completed"] as FilterType[]).map(
						(f) => (
							<button
								key={f}
								onClick={() => setFilter(f)}
								className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
									filter === f
										? "bg-orange-500 text-white"
										: "bg-white text-gray-600 hover:bg-gray-100"
								}`}
							>
								{f.charAt(0).toUpperCase() + f.slice(1)}
							</button>
						)
					)}
				</div>
			</div>

			{/* Bets List */}
			<div className="max-w-4xl mx-auto px-6 pb-8">
				{filteredBets.length > 0 ? (
					<div className="space-y-4">
						{filteredBets.map((bet) => (
							<BetListCard key={bet.id} bet={bet} currentUserId={user.id} />
						))}
					</div>
				) : (
					<div className="bg-white rounded-xl shadow-md p-12 text-center">
						<Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
						<h3 className="text-lg font-medium text-gray-800 mb-2">
							No {filter !== "all" ? filter : ""} bets found
						</h3>
						<p className="text-gray-500 mb-4">
							{filter === "all"
								? "Create your first bet to get started!"
								: `You don't have any ${filter} bets.`}
						</p>
						<Link
							to="/bets/create"
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

function BetListCard({
	bet,
	currentUserId,
}: {
	bet: Bet;
	currentUserId: string;
}) {
	const isCreator = bet.creatorId === currentUserId;
	const opponent = isCreator ? bet.opponent : bet.creator;
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
			case "pending":
				return <Clock className="w-5 h-5 text-yellow-500" />;
			default:
				return <Clock className="w-5 h-5 text-gray-500" />;
		}
	};

	const getStatusBadge = () => {
		const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
		switch (bet.status) {
			case "active":
				return `${baseClasses} bg-orange-100 text-orange-600`;
			case "completed":
				return isWinner
					? `${baseClasses} bg-green-100 text-green-600`
					: `${baseClasses} bg-red-100 text-red-600`;
			case "pending":
				return `${baseClasses} bg-yellow-100 text-yellow-600`;
			default:
				return `${baseClasses} bg-gray-100 text-gray-600`;
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
							: bet.status === "pending"
								? "bg-yellow-100"
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
								{isCreator ? "You" : opponent?.displayName} vs{" "}
								{isCreator ? opponent?.displayName : "You"}
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
								{bet.status === "completed" && !isWinner && "-"}$
								{bet.amount}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-3 mt-3">
						<span className={getStatusBadge()}>
							{bet.status === "completed"
								? isWinner
									? "Won"
									: "Lost"
								: bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
						</span>
						<span className="text-xs text-gray-500">
							{bet.status === "completed"
								? `Resolved ${new Date(bet.resolvedAt!).toLocaleDateString()}`
								: `Deadline: ${new Date(bet.deadline).toLocaleDateString()}`}
						</span>
						<span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full capitalize">
							{bet.verificationMethod.replace("_", " ")}
						</span>
					</div>
				</div>
			</div>
		</Link>
	);
}
