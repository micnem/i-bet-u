import type { UserAchievementInsert } from "../../lib/database.types";
import { supabaseAdmin } from "../../lib/supabase";
import { getAchievementById } from "./utils";

export async function fetchUserAchievements(userId: string) {
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

export async function tryAward(
	userId: string,
	achievementId: string,
	newAchievements: string[],
): Promise<void> {
	if (await awardAchievement(userId, achievementId)) {
		newAchievements.push(achievementId);
	}
}
