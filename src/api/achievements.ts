import { createServerFn } from "@tanstack/react-start";
import { getCurrentUser } from "../lib/auth";
import type { UserAchievementInsert } from "../lib/database.types";
import { supabaseAdmin } from "../lib/supabase";

// ============================================================================
// Types
// ============================================================================

export type AchievementCategory = "milestone" | "streak" | "social" | "special";
export type AchievementRarity =
	| "common"
	| "uncommon"
	| "rare"
	| "epic"
	| "legendary";

export interface Achievement {
	id: string;
	name: string;
	description: string;
	icon: string;
	category: AchievementCategory;
	rarity: AchievementRarity;
}

export interface AchievementContext {
	justWon?: boolean;
	betAmount?: number;
	opponentId?: string;
}

interface UserStats {
	total_bets: number;
	bets_won: number;
}

// ============================================================================
// Achievement Definitions
// ============================================================================

const MILESTONE_THRESHOLDS = {
	totalBets: [
		{ count: 1, id: "first_bet" },
		{ count: 10, id: "bets_10" },
		{ count: 50, id: "bets_50" },
		{ count: 100, id: "bets_100" },
	],
	wins: [
		{ count: 5, id: "wins_5" },
		{ count: 10, id: "wins_10" },
		{ count: 25, id: "wins_25" },
		{ count: 50, id: "wins_50" },
		{ count: 100, id: "wins_100" },
	],
	streaks: [
		{ count: 3, id: "streak_3" },
		{ count: 5, id: "streak_5" },
		{ count: 10, id: "streak_10" },
	],
} as const;

export const ACHIEVEMENTS: Achievement[] = [
	// Milestone - Total Bets
	{
		id: "first_bet",
		name: "First Steps",
		description: "Complete your first bet",
		icon: "🎲",
		category: "milestone",
		rarity: "common",
	},
	{
		id: "bets_10",
		name: "Active Bettor",
		description: "Complete 10 total bets",
		icon: "📊",
		category: "milestone",
		rarity: "common",
	},
	{
		id: "bets_50",
		name: "Dedicated Bettor",
		description: "Complete 50 total bets",
		icon: "📈",
		category: "milestone",
		rarity: "uncommon",
	},
	{
		id: "bets_100",
		name: "Bet Enthusiast",
		description: "Complete 100 total bets",
		icon: "🔥",
		category: "milestone",
		rarity: "rare",
	},

	// Milestone - Wins
	{
		id: "wins_5",
		name: "Getting Started",
		description: "Win 5 bets",
		icon: "🌟",
		category: "milestone",
		rarity: "common",
	},
	{
		id: "wins_10",
		name: "Winner",
		description: "Win 10 bets",
		icon: "🏆",
		category: "milestone",
		rarity: "uncommon",
	},
	{
		id: "wins_25",
		name: "Champion",
		description: "Win 25 bets",
		icon: "👑",
		category: "milestone",
		rarity: "rare",
	},
	{
		id: "wins_50",
		name: "Legend",
		description: "Win 50 bets",
		icon: "🎖️",
		category: "milestone",
		rarity: "epic",
	},
	{
		id: "wins_100",
		name: "Betting Master",
		description: "Win 100 bets",
		icon: "💎",
		category: "milestone",
		rarity: "legendary",
	},

	// Streak
	{
		id: "streak_3",
		name: "Hot Streak",
		description: "Win 3 bets in a row",
		icon: "⚡",
		category: "streak",
		rarity: "uncommon",
	},
	{
		id: "streak_5",
		name: "On Fire",
		description: "Win 5 bets in a row",
		icon: "🔥",
		category: "streak",
		rarity: "rare",
	},
	{
		id: "streak_10",
		name: "Unstoppable",
		description: "Win 10 bets in a row",
		icon: "💫",
		category: "streak",
		rarity: "legendary",
	},

	// Social
	{
		id: "first_friend_bet",
		name: "Friendly Wager",
		description: "Complete a bet with a friend",
		icon: "🤝",
		category: "social",
		rarity: "common",
	},
	{
		id: "bet_5_friends",
		name: "Social Bettor",
		description: "Bet with 5 different friends",
		icon: "👥",
		category: "social",
		rarity: "uncommon",
	},

	// Special
	{
		id: "high_roller",
		name: "High Roller",
		description: "Win a bet worth $100 or more",
		icon: "💰",
		category: "special",
		rarity: "rare",
	},
	{
		id: "comeback_kid",
		name: "Comeback Kid",
		description: "Win a bet after losing 3 in a row",
		icon: "🦅",
		category: "special",
		rarity: "rare",
	},
	{
		id: "perfect_month",
		name: "Perfect Month",
		description: "Win all bets in a calendar month (min 5)",
		icon: "📅",
		category: "special",
		rarity: "epic",
	},
];

const achievementMap = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

// ============================================================================
// Utility Functions
// ============================================================================

export function getAchievementById(id: string): Achievement | undefined {
	return achievementMap.get(id);
}

export function getRarityColor(rarity: AchievementRarity): string {
	const colors: Record<AchievementRarity, string> = {
		common: "bg-gray-100 text-gray-700 border-gray-300",
		uncommon: "bg-green-100 text-green-700 border-green-300",
		rare: "bg-blue-100 text-blue-700 border-blue-300",
		epic: "bg-purple-100 text-purple-700 border-purple-300",
		legendary: "bg-amber-100 text-amber-700 border-amber-300",
	};
	return colors[rarity] ?? colors.common;
}

export function getRarityLabel(rarity: AchievementRarity): string {
	return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}

// ============================================================================
// Database Operations
// ============================================================================

async function fetchUserAchievements(userId: string) {
	const { data, error } = await supabaseAdmin
		.from("user_achievements")
		.select("*")
		.eq("user_id", userId)
		.order("unlocked_at", { ascending: false });

	if (error) {
		return { data: null, error: error.message };
	}

	const unlockedAchievements = (data || []).map((ua) => ({
		...ua,
		achievement: getAchievementById(ua.achievement_id),
	}));

	return { data: unlockedAchievements, error: null };
}

export async function awardAchievement(
	userId: string,
	achievementId: string,
): Promise<boolean> {
	const { data: existing } = await supabaseAdmin
		.from("user_achievements")
		.select("id")
		.eq("user_id", userId)
		.eq("achievement_id", achievementId)
		.single();

	if (existing) {
		return false;
	}

	const insert: UserAchievementInsert = {
		user_id: userId,
		achievement_id: achievementId,
	};

	const { error } = await supabaseAdmin
		.from("user_achievements")
		.insert(insert);

	if (error) {
		console.error(
			`Failed to award achievement ${achievementId} to ${userId}:`,
			error,
		);
		return false;
	}

	return true;
}

// ============================================================================
// Achievement Checkers
// ============================================================================

async function tryAward(
	userId: string,
	achievementId: string,
	newAchievements: string[],
): Promise<void> {
	if (await awardAchievement(userId, achievementId)) {
		newAchievements.push(achievementId);
	}
}

async function checkMilestoneAchievements(
	userId: string,
	stats: UserStats,
	newAchievements: string[],
): Promise<void> {
	// Total bets milestones
	for (const { count, id } of MILESTONE_THRESHOLDS.totalBets) {
		if (stats.total_bets >= count) {
			await tryAward(userId, id, newAchievements);
		}
	}

	// Wins milestones
	for (const { count, id } of MILESTONE_THRESHOLDS.wins) {
		if (stats.bets_won >= count) {
			await tryAward(userId, id, newAchievements);
		}
	}

	// First friend bet (all bets are with friends in this app)
	if (stats.total_bets >= 1) {
		await tryAward(userId, "first_friend_bet", newAchievements);
	}
}

async function checkStreakAchievements(
	userId: string,
	newAchievements: string[],
): Promise<void> {
	const { data: recentBets } = await supabaseAdmin
		.from("bets")
		.select("winner_id")
		.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
		.eq("status", "completed")
		.order("resolved_at", { ascending: false })
		.limit(10);

	if (!recentBets?.length) return;

	let currentStreak = 0;
	for (const bet of recentBets) {
		if (bet.winner_id === userId) {
			currentStreak++;
		} else {
			break;
		}
	}

	for (const { count, id } of MILESTONE_THRESHOLDS.streaks) {
		if (currentStreak >= count) {
			await tryAward(userId, id, newAchievements);
		}
	}
}

async function checkComebackAchievement(
	userId: string,
	newAchievements: string[],
): Promise<void> {
	const { data: lastFourBets } = await supabaseAdmin
		.from("bets")
		.select("winner_id")
		.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
		.eq("status", "completed")
		.order("resolved_at", { ascending: false })
		.limit(4);

	if (!lastFourBets || lastFourBets.length < 4) return;

	const [latest, ...previous] = lastFourBets;
	const isWin = latest.winner_id === userId;
	const previousAllLosses = previous.every((b) => b.winner_id !== userId);

	if (isWin && previousAllLosses) {
		await tryAward(userId, "comeback_kid", newAchievements);
	}
}

async function checkSocialAchievements(
	userId: string,
	newAchievements: string[],
): Promise<void> {
	const { data: completedBets } = await supabaseAdmin
		.from("bets")
		.select("creator_id, opponent_id")
		.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
		.eq("status", "completed");

	if (!completedBets) return;

	const uniqueFriends = new Set(
		completedBets.map((bet) =>
			bet.creator_id === userId ? bet.opponent_id : bet.creator_id,
		),
	);

	if (uniqueFriends.size >= 5) {
		await tryAward(userId, "bet_5_friends", newAchievements);
	}
}

async function checkHighRollerAchievement(
	userId: string,
	betAmount: number,
	newAchievements: string[],
): Promise<void> {
	if (betAmount >= 100) {
		await tryAward(userId, "high_roller", newAchievements);
	}
}

async function checkPerfectMonthAchievement(
	userId: string,
	newAchievements: string[],
): Promise<void> {
	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const endOfMonth = new Date(
		now.getFullYear(),
		now.getMonth() + 1,
		0,
		23,
		59,
		59,
	);

	const { data: monthBets } = await supabaseAdmin
		.from("bets")
		.select("winner_id")
		.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
		.eq("status", "completed")
		.gte("resolved_at", startOfMonth.toISOString())
		.lte("resolved_at", endOfMonth.toISOString());

	if (!monthBets || monthBets.length < 5) return;

	const allWins = monthBets.every((b) => b.winner_id === userId);
	if (allWins) {
		await tryAward(userId, "perfect_month", newAchievements);
	}
}

// ============================================================================
// Main Achievement Check Function
// ============================================================================

export async function checkAndAwardAchievements(
	userId: string,
	context?: AchievementContext,
): Promise<string[]> {
	const newAchievements: string[] = [];

	// Fetch user stats
	const { data: user } = await supabaseAdmin
		.from("users")
		.select("total_bets, bets_won")
		.eq("id", userId)
		.single();

	if (!user) return newAchievements;

	// Always check milestone achievements
	await checkMilestoneAchievements(userId, user, newAchievements);

	// Always check social achievements
	await checkSocialAchievements(userId, newAchievements);

	// Win-specific achievements
	if (context?.justWon) {
		await checkStreakAchievements(userId, newAchievements);
		await checkComebackAchievement(userId, newAchievements);
		await checkPerfectMonthAchievement(userId, newAchievements);

		if (context.betAmount) {
			await checkHighRollerAchievement(
				userId,
				context.betAmount,
				newAchievements,
			);
		}
	}

	return newAchievements;
}

// ============================================================================
// Server Functions (API Endpoints)
// ============================================================================

export const getAllAchievements = createServerFn({ method: "GET" }).handler(
	async () => {
		return { error: null, data: ACHIEVEMENTS };
	},
);

export const getUserAchievements = createServerFn({ method: "GET" }).handler(
	async () => {
		const currentUser = await getCurrentUser();
		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}
		return fetchUserAchievements(currentUser.user.id);
	},
);

export const getUserAchievementsById = createServerFn({ method: "GET" })
	.inputValidator((data: { userId: string }) => data)
	.handler(async ({ data: { userId } }) => {
		const currentUser = await getCurrentUser();
		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}
		return fetchUserAchievements(userId);
	});
