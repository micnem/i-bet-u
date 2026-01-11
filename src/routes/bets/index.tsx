import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
	Trophy,
	Plus,
	Loader2,
	Clock,
	CheckCircle,
	XCircle,
	AlertCircle,
	ChevronRight,
} from "lucide-react";
import { getUserBets } from "../../api/bets";
import type { BetStatus } from "../../lib/database.types";

export const Route = createFileRoute("/bets/")({ component: BetsPage });

interface Bet {
	id: string;
	title: string;
	description: string | null;
	amount: number;
	status: BetStatus;
	deadline: string;
	created_at: string;
	creator_id: string;
	opponent_id: string;
	winner_id: string | null;
	creator: {
		id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
	opponent: {
		id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
}

type FilterStatus = "all" | BetStatus;

function BetsPage() {
	const [bets, setBets] = useState<Bet[]>([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState<FilterStatus>("all");

	useEffect(() => {
		async function fetchBets() {
			setLoading(true);
			const result = await getUserBets({ data: {} });
			if (!result.error && result.data) {
				setBets(result.data as Bet[]);
			}
			setLoading(false);
		}
		fetchBets();
	}, []);

	// Calculate stats
	const stats = {
		active: bets.filter((b) => b.status === "active").length,
		pending: bets.filter((b) => b.status === "pending").length,
		completed: bets.filter((b) => b.status === "completed").length,
		won: bets.filter((b) => b.status === "completed" && b.winner_id === b.creator_id).length,
		lost: bets.filter((b) => b.status === "completed" && b.winner_id === b.opponent_id).length,
	};

	// Filter bets
	const filteredBets =
		filter === "all" ? bets : bets.filter((b) => b.status === filter);

	const getStatusIcon = (status: BetStatus) => {
		switch (status) {
			case "active":
				return <Clock className="w-4 h-4 text-orange-500" />;
			case "pending":
				return <AlertCircle className="w-4 h-4 text-yellow-500" />;
			case "completed":
				return <CheckCircle className="w-4 h-4 text-green-500" />;
			case "declined":
			case "expired":
				return <XCircle className="w-4 h-4 text-red-500" />;
			default:
				return null;
		}
	};

	const getStatusBadge = (status: BetStatus) => {
		const styles: Record<BetStatus, string> = {
			active: "bg-orange-100 text-orange-700",
			pending: "bg-yellow-100 text-yellow-700",
			completed: "bg-green-100 text-green-700",
			declined: "bg-red-100 text-red-700",
			expired: "bg-gray-100 text-gray-700",
		};
		return styles[status] || "bg-gray-100 text-gray-700";
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
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
			<div className="bg-white shadow">
				<div className="max-w-4xl mx-auto px-6 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-800">My Bets</h1>
							<p className="text-gray-500">
								{bets.length} total bet{bets.length !== 1 ? "s" : ""}
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
						<button
							type="button"
							onClick={() => setFilter(filter === "active" ? "all" : "active")}
							className={`rounded-lg p-3 text-center transition-colors ${
								filter === "active"
									? "bg-orange-500 text-white"
									: "bg-orange-50 hover:bg-orange-100"
							}`}
						>
							<p
								className={`text-2xl font-bold ${
									filter === "active" ? "text-white" : "text-orange-500"
								}`}
							>
								{stats.active}
							</p>
							<p
								className={`text-sm ${
									filter === "active" ? "text-orange-100" : "text-gray-600"
								}`}
							>
								Active
							</p>
						</button>
						<button
							type="button"
							onClick={() => setFilter(filter === "pending" ? "all" : "pending")}
							className={`rounded-lg p-3 text-center transition-colors ${
								filter === "pending"
									? "bg-yellow-500 text-white"
									: "bg-yellow-50 hover:bg-yellow-100"
							}`}
						>
							<p
								className={`text-2xl font-bold ${
									filter === "pending" ? "text-white" : "text-yellow-500"
								}`}
							>
								{stats.pending}
							</p>
							<p
								className={`text-sm ${
									filter === "pending" ? "text-yellow-100" : "text-gray-600"
								}`}
							>
								Pending
							</p>
						</button>
						<button
							type="button"
							onClick={() =>
								setFilter(filter === "completed" ? "all" : "completed")
							}
							className={`rounded-lg p-3 text-center transition-colors ${
								filter === "completed"
									? "bg-gray-500 text-white"
									: "bg-gray-50 hover:bg-gray-100"
							}`}
						>
							<p
								className={`text-2xl font-bold ${
									filter === "completed" ? "text-white" : "text-gray-500"
								}`}
							>
								{stats.completed}
							</p>
							<p
								className={`text-sm ${
									filter === "completed" ? "text-gray-200" : "text-gray-600"
								}`}
							>
								Completed
							</p>
						</button>
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

			{/* Bets List */}
			<div className="max-w-4xl mx-auto px-6 py-8">
				{filteredBets.length === 0 ? (
					<div className="bg-white rounded-xl shadow-md p-12 text-center">
						<Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
						<h3 className="text-lg font-medium text-gray-800 mb-2">
							{filter === "all" ? "No bets yet" : `No ${filter} bets`}
						</h3>
						<p className="text-gray-500 mb-4">
							{filter === "all"
								? "Create your first bet to get started!"
								: "No bets match this filter."}
						</p>
						{filter === "all" && (
							<Link
								to="/bets/create"
								className="ibetu-btn-primary inline-flex items-center gap-2"
							>
								<Plus size={20} />
								Create a Bet
							</Link>
						)}
					</div>
				) : (
					<div className="space-y-4">
						{filteredBets.map((bet) => (
							<Link
								key={bet.id}
								to="/bets/$betId"
								params={{ betId: bet.id }}
								className="block bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow"
							>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-1">
											{getStatusIcon(bet.status)}
											<span
												className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadge(
													bet.status
												)}`}
											>
												{bet.status.charAt(0).toUpperCase() +
													bet.status.slice(1)}
											</span>
										</div>
										<h3 className="font-semibold text-gray-800">{bet.title}</h3>
										{bet.description && (
											<p className="text-sm text-gray-500 mt-1 line-clamp-1">
												{bet.description}
											</p>
										)}
										<div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
											<span>vs {bet.opponent.display_name}</span>
											<span>Due {formatDate(bet.deadline)}</span>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<div className="text-right">
											<p className="text-lg font-bold text-orange-500">
												${bet.amount}
											</p>
										</div>
										<ChevronRight className="w-5 h-5 text-gray-400" />
									</div>
								</div>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
