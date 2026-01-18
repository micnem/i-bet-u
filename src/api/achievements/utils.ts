import { achievementMap } from "./definitions";
import type { Achievement, AchievementRarity } from "./types";

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
