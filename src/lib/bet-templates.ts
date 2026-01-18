import type { VerificationMethod } from "./database.types";

export interface BetTemplate {
	id: string;
	name: string;
	title: string;
	description: string;
	suggestedAmount?: number;
	suggestedDeadlineDays?: number;
	verificationMethod: VerificationMethod;
	icon: string;
}

export interface BetTemplateCategory {
	id: string;
	name: string;
	icon: string;
	templates: BetTemplate[];
}

export const betTemplateCategories: BetTemplateCategory[] = [
	{
		id: "sports",
		name: "Sports",
		icon: "Trophy",
		templates: [
			{
				id: "sports-game-winner",
				name: "Game Winner",
				title: "[Team A] beats [Team B]",
				description: "Bet on which team wins the game. Loser pays the winner.",
				suggestedAmount: 20,
				suggestedDeadlineDays: 1,
				verificationMethod: "mutual_agreement",
				icon: "Trophy",
			},
			{
				id: "sports-player-performance",
				name: "Player Performance",
				title: "[Player] scores [X] points/goals",
				description: "Bet on whether a player hits a specific stat line in the game.",
				suggestedAmount: 15,
				suggestedDeadlineDays: 1,
				verificationMethod: "mutual_agreement",
				icon: "Star",
			},
			{
				id: "sports-season-champion",
				name: "Season Champion",
				title: "[Team] wins the championship",
				description: "Long-term bet on which team wins the league/tournament.",
				suggestedAmount: 50,
				suggestedDeadlineDays: 90,
				verificationMethod: "mutual_agreement",
				icon: "Medal",
			},
			{
				id: "sports-over-under",
				name: "Over/Under",
				title: "Total score over/under [X] points",
				description: "Bet on whether the combined score exceeds a number.",
				suggestedAmount: 10,
				suggestedDeadlineDays: 1,
				verificationMethod: "mutual_agreement",
				icon: "Target",
			},
		],
	},
	{
		id: "predictions",
		name: "Predictions",
		icon: "Sparkles",
		templates: [
			{
				id: "prediction-weather",
				name: "Weather Bet",
				title: "It will rain/snow on [date]",
				description: "Bet on what the weather will be on a specific day.",
				suggestedAmount: 5,
				suggestedDeadlineDays: 7,
				verificationMethod: "mutual_agreement",
				icon: "CloudRain",
			},
			{
				id: "prediction-event-outcome",
				name: "Event Outcome",
				title: "[Event] happens by [date]",
				description: "Predict whether a specific event will occur.",
				suggestedAmount: 20,
				suggestedDeadlineDays: 30,
				verificationMethod: "mutual_agreement",
				icon: "Calendar",
			},
			{
				id: "prediction-election",
				name: "Election/Vote",
				title: "[Candidate/Option] wins the vote",
				description: "Bet on the outcome of an election or poll.",
				suggestedAmount: 25,
				suggestedDeadlineDays: 30,
				verificationMethod: "mutual_agreement",
				icon: "Vote",
			},
			{
				id: "prediction-stock",
				name: "Stock/Crypto Price",
				title: "[Stock/Coin] reaches $[X] by [date]",
				description: "Bet on asset prices hitting a target.",
				suggestedAmount: 25,
				suggestedDeadlineDays: 30,
				verificationMethod: "mutual_agreement",
				icon: "TrendingUp",
			},
		],
	},
	{
		id: "challenges",
		name: "Challenges",
		icon: "Flame",
		templates: [
			{
				id: "challenge-fitness",
				name: "Fitness Goal",
				title: "I will [run X miles / do X pushups / etc]",
				description: "Challenge yourself or a friend to hit a fitness goal.",
				suggestedAmount: 20,
				suggestedDeadlineDays: 7,
				verificationMethod: "photo_proof",
				icon: "Dumbbell",
			},
			{
				id: "challenge-habit",
				name: "Habit Streak",
				title: "I will [habit] every day for [X] days",
				description: "Bet on maintaining a streak of a new habit.",
				suggestedAmount: 30,
				suggestedDeadlineDays: 30,
				verificationMethod: "honor_system",
				icon: "CheckCircle",
			},
			{
				id: "challenge-quit",
				name: "Quit Something",
				title: "I won't [bad habit] for [X] days",
				description: "Challenge to quit a bad habit for a period.",
				suggestedAmount: 50,
				suggestedDeadlineDays: 30,
				verificationMethod: "honor_system",
				icon: "Ban",
			},
			{
				id: "challenge-learning",
				name: "Learn Something",
				title: "I will learn [skill] by [date]",
				description: "Bet on learning a new skill or completing a course.",
				suggestedAmount: 25,
				suggestedDeadlineDays: 30,
				verificationMethod: "photo_proof",
				icon: "BookOpen",
			},
		],
	},
	{
		id: "fun",
		name: "Fun & Games",
		icon: "Gamepad2",
		templates: [
			{
				id: "fun-trivia",
				name: "Trivia Bet",
				title: "The answer to [question] is [X]",
				description: "Settle a trivia debate with a friendly wager.",
				suggestedAmount: 5,
				suggestedDeadlineDays: 1,
				verificationMethod: "mutual_agreement",
				icon: "HelpCircle",
			},
			{
				id: "fun-game-result",
				name: "Video Game Match",
				title: "I beat you at [game]",
				description: "Bet on who wins in a video game matchup.",
				suggestedAmount: 10,
				suggestedDeadlineDays: 7,
				verificationMethod: "mutual_agreement",
				icon: "Gamepad2",
			},
			{
				id: "fun-dare",
				name: "Dare Bet",
				title: "Loser has to [dare]",
				description: "Fun bet where the loser does a dare instead of paying.",
				suggestedAmount: 1,
				suggestedDeadlineDays: 7,
				verificationMethod: "photo_proof",
				icon: "Zap",
			},
			{
				id: "fun-movie-show",
				name: "Movie/Show Prediction",
				title: "[Character] will [outcome] in [show/movie]",
				description: "Bet on plot outcomes in movies or TV shows.",
				suggestedAmount: 10,
				suggestedDeadlineDays: 30,
				verificationMethod: "mutual_agreement",
				icon: "Film",
			},
		],
	},
	{
		id: "food",
		name: "Food & Drinks",
		icon: "UtensilsCrossed",
		templates: [
			{
				id: "food-dinner",
				name: "Dinner Bet",
				title: "Loser buys dinner",
				description: "Classic bet where the loser treats the winner to a meal.",
				suggestedAmount: 30,
				suggestedDeadlineDays: 7,
				verificationMethod: "mutual_agreement",
				icon: "UtensilsCrossed",
			},
			{
				id: "food-coffee",
				name: "Coffee Bet",
				title: "Loser buys coffee",
				description: "Casual bet for a coffee wager.",
				suggestedAmount: 7,
				suggestedDeadlineDays: 7,
				verificationMethod: "mutual_agreement",
				icon: "Coffee",
			},
			{
				id: "food-drinks",
				name: "Drinks Bet",
				title: "Loser buys a round of drinks",
				description: "Bet where the loser buys drinks at the bar.",
				suggestedAmount: 20,
				suggestedDeadlineDays: 7,
				verificationMethod: "mutual_agreement",
				icon: "Beer",
			},
		],
	},
];

// Flatten all templates for easy searching
export const allBetTemplates: BetTemplate[] = betTemplateCategories.flatMap(
	(category) => category.templates
);

// Get a template by ID
export function getBetTemplateById(id: string): BetTemplate | undefined {
	return allBetTemplates.find((template) => template.id === id);
}

// Calculate deadline date from days
export function getDeadlineFromDays(days: number): string {
	const deadline = new Date();
	deadline.setDate(deadline.getDate() + days);
	const year = deadline.getFullYear();
	const month = String(deadline.getMonth() + 1).padStart(2, "0");
	const day = String(deadline.getDate()).padStart(2, "0");
	const hours = String(deadline.getHours()).padStart(2, "0");
	const minutes = String(deadline.getMinutes()).padStart(2, "0");
	return `${year}-${month}-${day}T${hours}:${minutes}`;
}
