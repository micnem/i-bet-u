import { createServerFn } from "@tanstack/react-start";
import { getCurrentUser } from "../lib/auth";
import type { UserAchievementInsert } from "../lib/database.types";
import { supabaseAdmin } from "../lib/supabase";

// Achievement definitions - stored in code for flexibility
export interface Achievement {
	id: string;
	name: string;
	description: string;
	icon: string; // Emoji icon for the badge
	category: "milestone" | "streak" | "social" | "special";
	rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

export const ACHIEVEMENTS: Achievement[] = [
	// Milestone achievements
	{
		id: "first_bet",
		name: "First Steps",
		description: "Complete your first bet",
		icon: "🎲",
		category: "milestone",
		rarity: "common",
	},
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
	// Streak achievements
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
	// Social achievements
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
	// Special achievements
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

// Get achievement by ID
export function getAchievementById(id: string): Achievement | undefined {
	return ACHIEVEMENTS.find((a) => a.id === id);
}

// Get all achievements
export const getAllAchievements = createServerFn({ method: "GET" }).handler(
	async () => {
		return { error: null, data: ACHIEVEMENTS };
	},
);

// Get user's unlocked achievements
export const getUserAchievements = createServerFn({ method: "GET" }).handler(
	async () => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		const { data, error } = await supabaseAdmin
			.from("user_achievements")
			.select("*")
			.eq("user_id", userId)
			.order("unlocked_at", { ascending: false });

		if (error) {
			return { error: error.message, data: null };
		}

		// Map to full achievement data
		const unlockedAchievements = (data || []).map((ua) => ({
			...ua,
			achievement: getAchievementById(ua.achievement_id),
		}));

		return { error: null, data: unlockedAchievements };
	},
);

// Get achievements for a specific user (for viewing friend profiles)
export const getUserAchievementsById = createServerFn({ method: "GET" })
	.inputValidator((data: { userId: string }) => data)
	.handler(async ({ data: { userId } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const { data, error } = await supabaseAdmin
			.from("user_achievements")
			.select("*")
			.eq("user_id", userId)
			.order("unlocked_at", { ascending: false });

		if (error) {
			return { error: error.message, data: null };
		}

		// Map to full achievement data
		const unlockedAchievements = (data || []).map((ua) => ({
			...ua,
			achievement: getAchievementById(ua.achievement_id),
		}));

		return { error: null, data: unlockedAchievements };
	});

// Internal function to award an achievement (used by the system)
export async function awardAchievement(
	userId: string,
	achievementId: string,
): Promise<boolean> {
	// Check if user already has this achievement
	const { data: existing } = await supabaseAdmin
		.from("user_achievements")
		.select("id")
		.eq("user_id", userId)
		.eq("achievement_id", achievementId)
		.single();

	if (existing) {
		// User already has this achievement
		return false;
	}

	// Award the achievement
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

// Check and award achievements based on user stats and bet history
export async function checkAndAwardAchievements(
	userId: string,
	context?: {
		justWon?: boolean;
		betAmount?: number;
		opponentId?: string;
	},
): Promise<string[]> {
	const newAchievements: string[] = [];

	// Get user stats
	const { data: user } = await supabaseAdmin
		.from("users")
		.select("total_bets, bets_won, bets_lost")
		.eq("id", userId)
		.single();

	if (!user) return newAchievements;

	const { total_bets, bets_won } = user;

	// Check milestone achievements for total bets
	if (total_bets >= 1) {
		if (await awardAchievement(userId, "first_bet")) {
			newAchievements.push("first_bet");
		}
	}
	if (total_bets >= 10) {
		if (await awardAchievement(userId, "bets_10")) {
			newAchievements.push("bets_10");
		}
	}
	if (total_bets >= 50) {
		if (await awardAchievement(userId, "bets_50")) {
			newAchievements.push("bets_50");
		}
	}
	if (total_bets >= 100) {
		if (await awardAchievement(userId, "bets_100")) {
			newAchievements.push("bets_100");
		}
	}

	// Check wins milestones
	if (bets_won >= 5) {
		if (await awardAchievement(userId, "wins_5")) {
			newAchievements.push("wins_5");
		}
	}
	if (bets_won >= 10) {
		if (await awardAchievement(userId, "wins_10")) {
			newAchievements.push("wins_10");
		}
	}
	if (bets_won >= 25) {
		if (await awardAchievement(userId, "wins_25")) {
			newAchievements.push("wins_25");
		}
	}
	if (bets_won >= 50) {
		if (await awardAchievement(userId, "wins_50")) {
			newAchievements.push("wins_50");
		}
	}
	if (bets_won >= 100) {
		if (await awardAchievement(userId, "wins_100")) {
			newAchievements.push("wins_100");
		}
	}

	// Check first friend bet (they always bet with friends)
	if (total_bets >= 1) {
		if (await awardAchievement(userId, "first_friend_bet")) {
			newAchievements.push("first_friend_bet");
		}
	}

	// Check high roller achievement
	if (context?.justWon && context?.betAmount && context.betAmount >= 100) {
		if (await awardAchievement(userId, "high_roller")) {
			newAchievements.push("high_roller");
		}
	}

	// Check streak achievements - get recent completed bets
	if (context?.justWon) {
		const { data: recentBets } = await supabaseAdmin
			.from("bets")
			.select("winner_id, resolved_at")
			.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
			.eq("status", "completed")
			.order("resolved_at", { ascending: false })
			.limit(10);

		if (recentBets && recentBets.length > 0) {
			let currentStreak = 0;
			for (const bet of recentBets) {
				if (bet.winner_id === userId) {
					currentStreak++;
				} else {
					break;
				}
			}

			if (currentStreak >= 3) {
				if (await awardAchievement(userId, "streak_3")) {
					newAchievements.push("streak_3");
				}
			}
			if (currentStreak >= 5) {
				if (await awardAchievement(userId, "streak_5")) {
					newAchievements.push("streak_5");
				}
			}
			if (currentStreak >= 10) {
				if (await awardAchievement(userId, "streak_10")) {
					newAchievements.push("streak_10");
				}
			}
		}

		// Check comeback kid - win after 3 losses in a row
		const { data: lastFourBets } = await supabaseAdmin
			.from("bets")
			.select("winner_id")
			.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
			.eq("status", "completed")
			.order("resolved_at", { ascending: false })
			.limit(4);

		if (lastFourBets && lastFourBets.length >= 4) {
			// Check if latest is a win and previous 3 were losses
			const [latest, ...previous] = lastFourBets;
			if (
				latest.winner_id === userId &&
				previous.every((b) => b.winner_id !== userId)
			) {
				if (await awardAchievement(userId, "comeback_kid")) {
					newAchievements.push("comeback_kid");
				}
			}
		}
	}

	// Check social bettor - bet with 5 different friends
	const { data: completedBets } = await supabaseAdmin
		.from("bets")
		.select("creator_id, opponent_id")
		.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
		.eq("status", "completed");

	if (completedBets) {
		const uniqueFriends = new Set<string>();
		for (const bet of completedBets) {
			const friendId =
				bet.creator_id === userId ? bet.opponent_id : bet.creator_id;
			uniqueFriends.add(friendId);
		}
		if (uniqueFriends.size >= 5) {
			if (await awardAchievement(userId, "bet_5_friends")) {
				newAchievements.push("bet_5_friends");
			}
		}
	}

	// Check perfect month achievement
	if (context?.justWon) {
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

		if (monthBets && monthBets.length >= 5) {
			const allWins = monthBets.every((b) => b.winner_id === userId);
			if (allWins) {
				if (await awardAchievement(userId, "perfect_month")) {
					newAchievements.push("perfect_month");
				}
			}
		}
	}

	return newAchievements;
}

// Get rarity color for display
export function getRarityColor(rarity: Achievement["rarity"]): string {
	switch (rarity) {
		case "common":
			return "bg-gray-100 text-gray-700 border-gray-300";
		case "uncommon":
			return "bg-green-100 text-green-700 border-green-300";
		case "rare":
			return "bg-blue-100 text-blue-700 border-blue-300";
		case "epic":
			return "bg-purple-100 text-purple-700 border-purple-300";
		case "legendary":
			return "bg-amber-100 text-amber-700 border-amber-300";
		default:
			return "bg-gray-100 text-gray-700 border-gray-300";
	}
}

// Get rarity label
export function getRarityLabel(rarity: Achievement["rarity"]): string {
	return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}
