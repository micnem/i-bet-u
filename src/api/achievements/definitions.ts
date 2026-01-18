import type { Achievement, MilestoneThreshold } from "./types";

export const MILESTONE_THRESHOLDS: {
	totalBets: readonly MilestoneThreshold[];
	wins: readonly MilestoneThreshold[];
	streaks: readonly MilestoneThreshold[];
} = {
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

export const achievementMap = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));
