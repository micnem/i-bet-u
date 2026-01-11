import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";

// Get leaderboard
export const getLeaderboard = createServerFn({ method: "GET" })
	.inputValidator(
		(data: {
			timeframe?: "all" | "month" | "week";
			limit?: number;
		}) => data
	)
	.handler(async ({ data: { timeframe = "all", limit = 50 } }) => {
		let query = supabaseAdmin
			.from("users")
			.select("id, username, display_name, avatar_url, bets_won, bets_lost, total_bets")
			.gt("total_bets", 0)
			.order("bets_won", { ascending: false })
			.limit(limit);

		const { data, error } = await query;

		if (error) {
			return { error: error.message, data: null };
		}

		// Calculate win rates and rank
		const leaderboard = data.map((user, index) => ({
			rank: index + 1,
			id: user.id,
			username: user.username,
			displayName: user.display_name,
			avatarUrl: user.avatar_url,
			wins: user.bets_won,
			losses: user.bets_lost,
			totalBets: user.total_bets,
			winRate:
				user.total_bets > 0
					? Math.round((user.bets_won / user.total_bets) * 100)
					: 0,
		}));

		return { error: null, data: leaderboard };
	});

// Get current user's rank
export const getUserRank = createServerFn({ method: "GET" }).handler(
	async () => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", rank: null };
		}

		const userId = currentUser.user.id;

		// Get all users ordered by wins
		const { data: allUsers } = await supabaseAdmin
			.from("users")
			.select("id, bets_won")
			.gt("total_bets", 0)
			.order("bets_won", { ascending: false });

		if (!allUsers) {
			return { error: "Failed to fetch rankings", rank: null };
		}

		const rank = allUsers.findIndex((u) => u.id === userId) + 1;

		return {
			error: null,
			rank: rank > 0 ? rank : null,
			totalPlayers: allUsers.length,
		};
	}
);

// Get bet history between two users
export const getBetHistoryWithFriend = createServerFn({ method: "GET" })
	.inputValidator((data: { friendId: string; limit?: number; offset?: number }) => data)
	.handler(async ({ data: { friendId, limit = 50, offset = 0 } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		const { data: bets, error } = await supabaseAdmin
			.from("bets")
			.select(
				`
				*,
				creator:users!bets_creator_id_fkey(*),
				opponent:users!bets_opponent_id_fkey(*)
			`
			)
			.or(
				`and(creator_id.eq.${userId},opponent_id.eq.${friendId}),and(creator_id.eq.${friendId},opponent_id.eq.${userId})`
			)
			.order("created_at", { ascending: false })
			.range(offset, offset + limit - 1);

		if (error) {
			return { error: error.message, data: null };
		}

		// Calculate stats
		const completedBets = bets.filter((b) => b.status === "completed");
		const userWins = completedBets.filter(
			(b) => b.winner_id === userId
		).length;
		const friendWins = completedBets.filter(
			(b) => b.winner_id === friendId
		).length;

		return {
			error: null,
			data: {
				bets,
				stats: {
					totalBets: bets.length,
					completedBets: completedBets.length,
					userWins,
					friendWins,
					activeBets: bets.filter((b) => b.status === "active").length,
				},
			},
		};
	});

// Get friend stats comparison
export const getFriendComparison = createServerFn({ method: "GET" })
	.inputValidator((data: { friendId: string }) => data)
	.handler(async ({ data: { friendId } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		// Get both users' stats
		const { data: users, error } = await supabaseAdmin
			.from("users")
			.select("id, username, display_name, avatar_url, total_bets, bets_won, bets_lost")
			.in("id", [userId, friendId]);

		if (error || !users || users.length !== 2) {
			return { error: error?.message || "Users not found", data: null };
		}

		const currentUserData = users.find((u) => u.id === userId);
		const friendData = users.find((u) => u.id === friendId);

		// Get head-to-head stats
		const { data: h2hBets } = await supabaseAdmin
			.from("bets")
			.select("winner_id, status")
			.or(
				`and(creator_id.eq.${userId},opponent_id.eq.${friendId}),and(creator_id.eq.${friendId},opponent_id.eq.${userId})`
			)
			.eq("status", "completed");

		const h2hUserWins = h2hBets?.filter((b) => b.winner_id === userId).length || 0;
		const h2hFriendWins = h2hBets?.filter((b) => b.winner_id === friendId).length || 0;

		return {
			error: null,
			data: {
				currentUser: {
					...currentUserData,
					winRate: currentUserData?.total_bets
						? Math.round((currentUserData.bets_won / currentUserData.total_bets) * 100)
						: 0,
				},
				friend: {
					...friendData,
					winRate: friendData?.total_bets
						? Math.round((friendData.bets_won / friendData.total_bets) * 100)
						: 0,
				},
				headToHead: {
					totalGames: h2hBets?.length || 0,
					userWins: h2hUserWins,
					friendWins: h2hFriendWins,
				},
			},
		};
	});

// Get top friends by bets together
export const getTopBettingFriends = createServerFn({ method: "GET" })
	.inputValidator((data: { limit?: number }) => data)
	.handler(async ({ data: { limit = 5 } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		// Get all bets involving current user
		const { data: bets } = await supabaseAdmin
			.from("bets")
			.select("creator_id, opponent_id, winner_id, status")
			.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`);

		if (!bets) {
			return { error: "Failed to fetch bets", data: null };
		}

		// Count bets per opponent
		const opponentCounts: Record<string, { total: number; wins: number }> = {};

		for (const bet of bets) {
			const opponentId =
				bet.creator_id === userId ? bet.opponent_id : bet.creator_id;

			if (!opponentCounts[opponentId]) {
				opponentCounts[opponentId] = { total: 0, wins: 0 };
			}
			opponentCounts[opponentId].total++;
			if (bet.status === "completed" && bet.winner_id === userId) {
				opponentCounts[opponentId].wins++;
			}
		}

		// Sort by total bets and get top N
		const topOpponentIds = Object.entries(opponentCounts)
			.sort(([, a], [, b]) => b.total - a.total)
			.slice(0, limit)
			.map(([id]) => id);

		if (topOpponentIds.length === 0) {
			return { error: null, data: [] };
		}

		// Get user details for top opponents
		const { data: users } = await supabaseAdmin
			.from("users")
			.select("id, username, display_name, avatar_url")
			.in("id", topOpponentIds);

		const result = topOpponentIds.map((id) => {
			const user = users?.find((u) => u.id === id);
			const stats = opponentCounts[id];
			return {
				id,
				username: user?.username || "Unknown",
				displayName: user?.display_name || "Unknown",
				avatarUrl: user?.avatar_url,
				totalBets: stats.total,
				winsAgainst: stats.wins,
			};
		});

		return { error: null, data: result };
	});
