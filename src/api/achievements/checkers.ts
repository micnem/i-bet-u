import { supabaseAdmin } from "../../lib/supabase";
import { tryAward } from "./db";
import { MILESTONE_THRESHOLDS } from "./definitions";
import type { AchievementContext, UserStats } from "./types";

export async function checkMilestoneAchievements(
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

export async function checkStreakAchievements(
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

export async function checkComebackAchievement(
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

export async function checkSocialAchievements(
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

export async function checkHighRollerAchievement(
	userId: string,
	betAmount: number,
	newAchievements: string[],
): Promise<void> {
	if (betAmount >= 100) {
		await tryAward(userId, "high_roller", newAchievements);
	}
}

export async function checkPerfectMonthAchievement(
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
