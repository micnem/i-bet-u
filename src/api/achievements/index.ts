import { createServerFn } from "@tanstack/react-start";
import { getCurrentUser } from "../../lib/auth";
import { fetchUserAchievements } from "./db";
import { ACHIEVEMENTS } from "./definitions";

// Re-export checkers
export { checkAndAwardAchievements } from "./checkers";
// Re-export database operations
export { awardAchievement } from "./db";
// Re-export definitions
export { ACHIEVEMENTS, MILESTONE_THRESHOLDS } from "./definitions";
// Re-export types
export type {
	Achievement,
	AchievementCategory,
	AchievementContext,
	AchievementRarity,
} from "./types";
// Re-export utilities
export { getAchievementById, getRarityColor, getRarityLabel } from "./utils";

// Server Functions (API Endpoints)
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
