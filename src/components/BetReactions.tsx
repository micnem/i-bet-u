import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
	getBetReactions,
	REACTION_EMOJIS,
	toggleBetReaction,
} from "../api/bets";
import { useUser } from "./AuthProvider";

interface Reaction {
	id: string;
	bet_id: string;
	user_id: string;
	emoji: string;
	created_at: string;
	user: {
		id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
}

interface ReactionGroup {
	emoji: string;
	count: number;
	users: { id: string; display_name: string }[];
	currentUserReacted: boolean;
}

interface BetReactionsProps {
	betId: string;
}

export function BetReactions({ betId }: BetReactionsProps) {
	const { user } = useUser();
	const [reactions, setReactions] = useState<Reaction[]>([]);
	const [loading, setLoading] = useState(true);
	const [togglingEmoji, setTogglingEmoji] = useState<string | null>(null);
	const [showPicker, setShowPicker] = useState(false);

	useEffect(() => {
		async function fetchReactions() {
			setLoading(true);
			const result = await getBetReactions({ data: { betId } });
			if (result.data) {
				setReactions(result.data as Reaction[]);
			}
			setLoading(false);
		}
		fetchReactions();
	}, [betId]);

	const handleToggleReaction = async (emoji: string) => {
		if (!user || togglingEmoji) return;

		setTogglingEmoji(emoji);
		const result = await toggleBetReaction({ data: { betId, emoji } });

		if (!result.error && result.data) {
			const data = result.data as { action: string; reaction?: Reaction };
			if (data.action === "added" && data.reaction) {
				setReactions((prev) => [...prev, data.reaction as Reaction]);
			} else if (data.action === "removed") {
				setReactions((prev) =>
					prev.filter((r) => !(r.user_id === user.id && r.emoji === emoji)),
				);
			}
		}
		setTogglingEmoji(null);
		setShowPicker(false);
	};

	// Group reactions by emoji
	const groupedReactions: ReactionGroup[] = REACTION_EMOJIS.map((emoji) => {
		const emojiReactions = reactions.filter((r) => r.emoji === emoji);
		return {
			emoji,
			count: emojiReactions.length,
			users: emojiReactions.map((r) => ({
				id: r.user.id,
				display_name: r.user.display_name,
			})),
			currentUserReacted: emojiReactions.some((r) => r.user_id === user?.id),
		};
	}).filter((group) => group.count > 0);

	// Get emojis not yet used by current user
	const availableEmojis = REACTION_EMOJIS.filter(
		(emoji) =>
			!reactions.some((r) => r.emoji === emoji && r.user_id === user?.id),
	);

	if (loading) {
		return (
			<div className="flex items-center gap-2 py-2">
				<Loader2 className="w-4 h-4 animate-spin text-gray-400" />
				<span className="text-sm text-gray-500">Loading reactions...</span>
			</div>
		);
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			{/* Existing reactions */}
			{groupedReactions.map((group) => (
				<button
					type="button"
					key={group.emoji}
					onClick={() => handleToggleReaction(group.emoji)}
					disabled={togglingEmoji !== null}
					title={group.users.map((u) => u.display_name).join(", ")}
					className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
						group.currentUserReacted
							? "bg-orange-100 text-orange-700 border-2 border-orange-300 hover:bg-orange-200"
							: "bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200"
					} ${togglingEmoji === group.emoji ? "opacity-50" : ""}`}
				>
					<span className="text-base">{group.emoji}</span>
					<span>{group.count}</span>
					{togglingEmoji === group.emoji && (
						<Loader2 className="w-3 h-3 animate-spin" />
					)}
				</button>
			))}

			{/* Add reaction button */}
			{availableEmojis.length > 0 && (
				<div className="relative">
					<button
						type="button"
						onClick={() => setShowPicker(!showPicker)}
						className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all"
						title="Add reaction"
					>
						<Plus className="w-4 h-4" />
					</button>

					{/* Emoji picker dropdown */}
					{showPicker && (
						<div className="absolute left-0 top-full mt-2 z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
							<div className="flex gap-1">
								{availableEmojis.map((emoji) => (
									<button
										type="button"
										key={emoji}
										onClick={() => handleToggleReaction(emoji)}
										disabled={togglingEmoji !== null}
										className="w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-gray-100 transition-colors"
									>
										{emoji}
									</button>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Empty state */}
			{groupedReactions.length === 0 && !showPicker && (
				<span className="text-sm text-gray-400">Be the first to react!</span>
			)}
		</div>
	);
}
