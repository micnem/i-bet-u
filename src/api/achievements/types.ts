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

export interface UserStats {
	total_bets: number;
	bets_won: number;
}

export interface MilestoneThreshold {
	count: number;
	id: string;
}
