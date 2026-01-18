import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "../lib/supabase";
import type {
	Bet,
	BetInsert,
	BetStatus,
	VerificationMethod,
	CommentInsert,
	BetReactionInsert,
} from "../lib/database.types";
import { getCurrentUser } from "../lib/auth";
import { sendWinnerConfirmationEmail, sendBetInvitationEmail, sendBetAcceptedEmail, sendCommentNotificationEmail } from "./reminders";
import { checkAndAwardAchievements } from "./achievements";

// Get all bets for current user
export const getUserBets = createServerFn({ method: "GET" })
	.inputValidator(
		(data: { status?: BetStatus; limit?: number; offset?: number }) => data
	)
	.handler(async ({ data: { status, limit = 50, offset = 0 } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		let query = supabaseAdmin
			.from("bets")
			.select(
				`
				*,
				creator:users!bets_creator_id_fkey(*),
				opponent:users!bets_opponent_id_fkey(*)
			`
			)
			.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
			.order("created_at", { ascending: false })
			.range(offset, offset + limit - 1);

		if (status) {
			query = query.eq("status", status);
		}

		const { data, error } = await query;

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data };
	});

// Get a specific bet by ID
export const getBetById = createServerFn({ method: "GET" })
	.inputValidator((data: { betId: string }) => data)
	.handler(async ({ data: { betId } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		const { data, error } = await supabaseAdmin
			.from("bets")
			.select(
				`
				*,
				creator:users!bets_creator_id_fkey(*),
				opponent:users!bets_opponent_id_fkey(*),
				winner:users!bets_winner_id_fkey(*)
			`
			)
			.eq("id", betId)
			.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
			.single();

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data };
	});

// Create a new bet
export const createBet = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			title: string;
			description: string;
			amount: number;
			opponentId: string;
			deadline: string;
			verificationMethod: VerificationMethod;
		}) => data
	)
	.handler(async ({ data }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		// Check if opponent exists and is a friend
		const { data: friendship } = await supabaseAdmin
			.from("friendships")
			.select("id")
			.or(
				`and(user_id.eq.${userId},friend_id.eq.${data.opponentId}),and(user_id.eq.${data.opponentId},friend_id.eq.${userId})`
			)
			.eq("status", "accepted")
			.single();

		if (!friendship) {
			return { error: "You can only bet with friends", data: null };
		}

		// Create the bet
		const betInsert: BetInsert = {
			title: data.title,
			description: data.description,
			amount: data.amount,
			creator_id: userId,
			opponent_id: data.opponentId,
			deadline: data.deadline,
			verification_method: data.verificationMethod,
			status: "pending",
		};

		const { data: bet, error } = await supabaseAdmin
			.from("bets")
			.insert(betInsert)
			.select(
				`
				*,
				creator:users!bets_creator_id_fkey(*),
				opponent:users!bets_opponent_id_fkey(*)
			`
			)
			.single();

		if (error) {
			return { error: error.message, data: null };
		}

		// Send invitation email to opponent (await to ensure it completes before worker terminates)
		try {
			await sendBetInvitationEmail({
				recipientId: data.opponentId,
				recipientName: bet.opponent.display_name,
				creatorName: bet.creator.display_name,
				creatorUsername: bet.creator.username,
				betTitle: bet.title,
				betDescription: bet.description || "",
				betAmount: Number(bet.amount),
				betDeadline: bet.deadline,
				betId: bet.id,
			});
		} catch (err) {
			console.error("Failed to send bet invitation email:", err);
		}

		return { error: null, data: bet };
	});

// Accept a bet (as opponent)
export const acceptBet = createServerFn({ method: "POST" })
	.inputValidator((data: { betId: string }) => data)
	.handler(async ({ data: { betId } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		// Get the bet with user details for email
		const { data: bet } = await supabaseAdmin
			.from("bets")
			.select(`
				*,
				creator:users!bets_creator_id_fkey(id, display_name, username),
				opponent:users!bets_opponent_id_fkey(id, display_name, username)
			`)
			.eq("id", betId)
			.eq("opponent_id", userId)
			.eq("status", "pending")
			.single();

		if (!bet) {
			return { error: "Bet not found or already processed", data: null };
		}

		// Update bet status to active
		const { data: updatedBet, error: betError } = await supabaseAdmin
			.from("bets")
			.update({
				status: "active",
				accepted_at: new Date().toISOString(),
			})
			.eq("id", betId)
			.select()
			.single();

		if (betError) {
			return { error: betError.message, data: null };
		}

		// Send acceptance email to bet creator
		try {
			await sendBetAcceptedEmail({
				recipientId: bet.creator_id,
				recipientName: bet.creator.display_name,
				acceptorName: bet.opponent.display_name,
				acceptorUsername: bet.opponent.username,
				betTitle: bet.title,
				betAmount: Number(bet.amount),
				betDeadline: bet.deadline,
				betId: bet.id,
			});
		} catch (err) {
			console.error("Failed to send bet accepted email:", err);
		}

		return { error: null, data: updatedBet };
	});

// Decline a bet (as opponent)
export const declineBet = createServerFn({ method: "POST" })
	.inputValidator((data: { betId: string }) => data)
	.handler(async ({ data: { betId } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		const { data: bet, error } = await supabaseAdmin
			.from("bets")
			.update({ status: "declined" })
			.eq("id", betId)
			.eq("opponent_id", userId)
			.eq("status", "pending")
			.select()
			.single();

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data: bet };
	});

// Approve bet result (both parties must approve)
export const approveBetResult = createServerFn({ method: "POST" })
	.inputValidator((data: { betId: string; winnerId: string }) => data)
	.handler(async ({ data: { betId, winnerId } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		// Get the bet with user details for email
		const { data: bet } = await supabaseAdmin
			.from("bets")
			.select(`
				*,
				creator:users!bets_creator_id_fkey(id, display_name),
				opponent:users!bets_opponent_id_fkey(id, display_name)
			`)
			.eq("id", betId)
			.eq("status", "active")
			.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
			.single();

		if (!bet) {
			return { error: "Bet not found or not active", data: null };
		}

		// Validate winner is a participant
		if (winnerId !== bet.creator_id && winnerId !== bet.opponent_id) {
			return { error: "Invalid winner", data: null };
		}

		// Update approval
		const isCreator = userId === bet.creator_id;
		const updateData = isCreator
			? { creator_approved: true, winner_id: winnerId }
			: { opponent_approved: true, winner_id: winnerId };

		const { data: updatedBet, error } = await supabaseAdmin
			.from("bets")
			.update(updateData)
			.eq("id", betId)
			.select()
			.single();

		if (error) {
			return { error: error.message, data: null };
		}

		// Check if both approved with same winner
		if (
			updatedBet.creator_approved &&
			updatedBet.opponent_approved &&
			updatedBet.winner_id
		) {
			// Resolve the bet
			await resolveBet({ betId, winnerId: updatedBet.winner_id });
		} else {
			// Only one party has approved - send confirmation email to the other
			const declarerName = currentUser.user.display_name;
			const winnerName = winnerId === bet.creator_id
				? bet.creator.display_name
				: bet.opponent.display_name;
			const recipientId = isCreator ? bet.opponent_id : bet.creator_id;
			const recipientName = isCreator ? bet.opponent.display_name : bet.creator.display_name;

			// Send email (await to ensure it completes before worker terminates)
			try {
				await sendWinnerConfirmationEmail({
					recipientId,
					recipientName,
					declarerName,
					winnerName,
					betTitle: bet.title,
					betAmount: Number(bet.amount),
					betId,
				});
			} catch (err) {
				console.error("Failed to send winner confirmation email:", err);
			}
		}

		return { error: null, data: updatedBet };
	});

// Internal function to resolve bet and update stats
async function resolveBet({
	betId,
	winnerId,
}: {
	betId: string;
	winnerId: string;
}) {
	const { data: bet } = await supabaseAdmin
		.from("bets")
		.select("*")
		.eq("id", betId)
		.single();

	if (!bet) return;

	const loserId =
		winnerId === bet.creator_id ? bet.opponent_id : bet.creator_id;

	// Update bet status
	await supabaseAdmin
		.from("bets")
		.update({
			status: "completed",
			outcome: winnerId === bet.creator_id ? "win" : "loss",
			resolved_at: new Date().toISOString(),
		})
		.eq("id", betId);

	// Update stats
	await supabaseAdmin.rpc("increment_wins", { user_id: winnerId });
	await supabaseAdmin.rpc("increment_losses", { user_id: loserId });

	// Check and award achievements for both participants
	try {
		// Award achievements to winner (with win context)
		await checkAndAwardAchievements(winnerId, {
			justWon: true,
			betAmount: Number(bet.amount),
			opponentId: loserId,
		});

		// Award achievements to loser (without win context)
		await checkAndAwardAchievements(loserId, {
			justWon: false,
			betAmount: Number(bet.amount),
			opponentId: winnerId,
		});
	} catch (err) {
		console.error("Failed to check achievements:", err);
	}
}

// Cancel a pending bet (creator only)
export const cancelBet = createServerFn({ method: "POST" })
	.inputValidator((data: { betId: string }) => data)
	.handler(async ({ data: { betId } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		const { data: bet, error } = await supabaseAdmin
			.from("bets")
			.update({ status: "expired" })
			.eq("id", betId)
			.eq("creator_id", userId)
			.eq("status", "pending")
			.select()
			.single();

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data: bet };
	});

// Get pending bet invites for current user
export const getPendingBetInvites = createServerFn({ method: "GET" }).handler(
	async () => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		const { data, error } = await supabaseAdmin
			.from("bets")
			.select(
				`
				*,
				creator:users!bets_creator_id_fkey(*)
			`
			)
			.eq("opponent_id", userId)
			.eq("status", "pending")
			.order("created_at", { ascending: false });

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data };
	}
);

// Get bets awaiting resolution confirmation (where other party declared a winner)
export const getBetsAwaitingConfirmation = createServerFn({
	method: "GET",
}).handler(async () => {
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		return { error: "Not authenticated", data: null };
	}

	const userId = currentUser.user.id;

	const { data, error } = await supabaseAdmin
		.from("bets")
		.select(
			`
			*,
			creator:users!bets_creator_id_fkey(id, display_name, avatar_url),
			opponent:users!bets_opponent_id_fkey(id, display_name, avatar_url),
			winner:users!bets_winner_id_fkey(id, display_name)
		`
		)
		.eq("status", "active")
		.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
		.not("winner_id", "is", null)
		.order("updated_at", { ascending: false });

	if (error) {
		return { error: error.message, data: null };
	}

	// Filter to only include bets where current user hasn't approved yet
	const betsNeedingConfirmation = (data || []).filter((bet) => {
		const isCreator = bet.creator_id === userId;
		const hasApproved = isCreator ? bet.creator_approved : bet.opponent_approved;
		return !hasApproved;
	});

	return { error: null, data: betsNeedingConfirmation };
});

// Get active bets count
export const getActiveBetsCount = createServerFn({ method: "GET" }).handler(
	async () => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", count: 0 };
		}

		const userId = currentUser.user.id;

		const { count, error } = await supabaseAdmin
			.from("bets")
			.select("*", { count: "exact", head: true })
			.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
			.eq("status", "active");

		if (error) {
			return { error: error.message, count: 0 };
		}

		return { error: null, count: count || 0 };
	}
);

// Get amounts owed summary (calculated from completed bets)
export const getAmountsOwedSummary = createServerFn({ method: "GET" }).handler(
	async () => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		// Get all completed bets for the user
		const { data: completedBets, error } = await supabaseAdmin
			.from("bets")
			.select(
				`
				*,
				creator:users!bets_creator_id_fkey(id, username, display_name, avatar_url),
				opponent:users!bets_opponent_id_fkey(id, username, display_name, avatar_url)
			`
			)
			.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
			.eq("status", "completed");

		if (error) {
			return { error: error.message, data: null };
		}

		// Calculate totals
		let totalWon = 0;
		let totalLost = 0;
		const balanceByFriend: Record<
			string,
			{ friend: { id: string; username: string; display_name: string; avatar_url: string | null }; amount: number }
		> = {};

		for (const bet of completedBets || []) {
			const isCreator = bet.creator_id === userId;
			const isWinner = bet.winner_id === userId;
			const friendId = isCreator ? bet.opponent_id : bet.creator_id;
			const friend = isCreator ? bet.opponent : bet.creator;

			if (isWinner) {
				totalWon += Number(bet.amount);
				// Friend owes user this amount
				if (!balanceByFriend[friendId]) {
					balanceByFriend[friendId] = { friend, amount: 0 };
				}
				balanceByFriend[friendId].amount += Number(bet.amount);
			} else {
				totalLost += Number(bet.amount);
				// User owes friend this amount
				if (!balanceByFriend[friendId]) {
					balanceByFriend[friendId] = { friend, amount: 0 };
				}
				balanceByFriend[friendId].amount -= Number(bet.amount);
			}
		}

		// Convert to array and sort by absolute amount
		const friendBalances = Object.values(balanceByFriend).sort(
			(a, b) => Math.abs(b.amount) - Math.abs(a.amount)
		);

		return {
			error: null,
			data: {
				totalWon,
				totalLost,
				netBalance: totalWon - totalLost,
				friendBalances,
			},
		};
	}
);

// Get comments for a bet
export const getBetComments = createServerFn({ method: "GET" })
	.inputValidator((data: { betId: string }) => data)
	.handler(async ({ data: { betId } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		// Verify user is a participant in the bet
		const { data: bet } = await supabaseAdmin
			.from("bets")
			.select("id")
			.eq("id", betId)
			.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
			.single();

		if (!bet) {
			return { error: "Bet not found or access denied", data: null };
		}

		const { data, error } = await supabaseAdmin
			.from("comments")
			.select(
				`
				*,
				author:users!comments_author_id_fkey(id, username, display_name, avatar_url)
			`
			)
			.eq("bet_id", betId)
			.order("created_at", { ascending: true });

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data };
	});

// Create a comment on a bet
export const createComment = createServerFn({ method: "POST" })
	.inputValidator((data: { betId: string; content: string }) => data)
	.handler(async ({ data: { betId, content } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		// Validate content
		const trimmedContent = content.trim();
		if (!trimmedContent || trimmedContent.length === 0) {
			return { error: "Comment cannot be empty", data: null };
		}

		if (trimmedContent.length > 1000) {
			return { error: "Comment is too long (max 1000 characters)", data: null };
		}

		// Verify user is a participant in the bet and get bet details
		const { data: bet } = await supabaseAdmin
			.from("bets")
			.select(`
				id, title, creator_id, opponent_id,
				creator:users!bets_creator_id_fkey(display_name),
				opponent:users!bets_opponent_id_fkey(display_name)
			`)
			.eq("id", betId)
			.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
			.single();

		if (!bet) {
			return { error: "Bet not found or access denied", data: null };
		}

		const commentInsert: CommentInsert = {
			bet_id: betId,
			author_id: userId,
			content: trimmedContent,
		};

		const { data, error } = await supabaseAdmin
			.from("comments")
			.insert(commentInsert)
			.select(
				`
				*,
				author:users!comments_author_id_fkey(id, username, display_name, avatar_url)
			`
			)
			.single();

		if (error) {
			return { error: error.message, data: null };
		}

		// Send email notification to the other participant
		const recipientId = userId === bet.creator_id ? bet.opponent_id : bet.creator_id;
		const recipientName = userId === bet.creator_id ? bet.opponent.display_name : bet.creator.display_name;
		try {
			await sendCommentNotificationEmail({
				recipientId,
				recipientName,
				commenterName: currentUser.user.display_name,
				betTitle: bet.title,
				commentContent: trimmedContent,
				betId,
			});
		} catch (err) {
			console.error("Failed to send comment notification email:", err);
		}

		return { error: null, data };
	});

// Delete a comment
export const deleteComment = createServerFn({ method: "POST" })
	.inputValidator((data: { commentId: string }) => data)
	.handler(async ({ data: { commentId } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		// Delete the comment (only if user is the author)
		const { error } = await supabaseAdmin
			.from("comments")
			.delete()
			.eq("id", commentId)
			.eq("author_id", userId);

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data: { success: true } };
	});

// Update a comment
export const updateComment = createServerFn({ method: "POST" })
	.inputValidator((data: { commentId: string; content: string }) => data)
	.handler(async ({ data: { commentId, content } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		// Validate content
		const trimmedContent = content.trim();
		if (!trimmedContent || trimmedContent.length === 0) {
			return { error: "Comment cannot be empty", data: null };
		}

		if (trimmedContent.length > 1000) {
			return { error: "Comment is too long (max 1000 characters)", data: null };
		}

		// Update the comment (only if user is the author)
		const { data, error } = await supabaseAdmin
			.from("comments")
			.update({ content: trimmedContent })
			.eq("id", commentId)
			.eq("author_id", userId)
			.select(
				`
				*,
				author:users!comments_author_id_fkey(id, username, display_name, avatar_url)
			`
			)
			.single();

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data };
	});

// Available reaction emojis
export const REACTION_EMOJIS = ["👍", "👎", "😂", "🔥", "🎯", "💰"] as const;
export type ReactionEmoji = typeof REACTION_EMOJIS[number];

// Get reactions for a bet
export const getBetReactions = createServerFn({ method: "GET" })
	.inputValidator((data: { betId: string }) => data)
	.handler(async ({ data: { betId } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		// Verify user is a participant in the bet
		const { data: bet } = await supabaseAdmin
			.from("bets")
			.select("id")
			.eq("id", betId)
			.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
			.single();

		if (!bet) {
			return { error: "Bet not found or access denied", data: null };
		}

		const { data, error } = await supabaseAdmin
			.from("bet_reactions")
			.select(
				`
				*,
				user:users!bet_reactions_user_id_fkey(id, username, display_name, avatar_url)
			`
			)
			.eq("bet_id", betId)
			.order("created_at", { ascending: true });

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data };
	});

// Add a reaction to a bet
export const addBetReaction = createServerFn({ method: "POST" })
	.inputValidator((data: { betId: string; emoji: string }) => data)
	.handler(async ({ data: { betId, emoji } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		// Validate emoji is in allowed list
		if (!REACTION_EMOJIS.includes(emoji as ReactionEmoji)) {
			return { error: "Invalid emoji", data: null };
		}

		// Verify user is a participant in the bet
		const { data: bet } = await supabaseAdmin
			.from("bets")
			.select("id")
			.eq("id", betId)
			.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
			.single();

		if (!bet) {
			return { error: "Bet not found or access denied", data: null };
		}

		const reactionInsert: BetReactionInsert = {
			bet_id: betId,
			user_id: userId,
			emoji,
		};

		const { data, error } = await supabaseAdmin
			.from("bet_reactions")
			.insert(reactionInsert)
			.select(
				`
				*,
				user:users!bet_reactions_user_id_fkey(id, username, display_name, avatar_url)
			`
			)
			.single();

		if (error) {
			// Handle duplicate reaction (user already reacted with this emoji)
			if (error.code === "23505") {
				return { error: "You already reacted with this emoji", data: null };
			}
			return { error: error.message, data: null };
		}

		return { error: null, data };
	});

// Remove a reaction from a bet
export const removeBetReaction = createServerFn({ method: "POST" })
	.inputValidator((data: { betId: string; emoji: string }) => data)
	.handler(async ({ data: { betId, emoji } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		// Delete the reaction (only if user owns it)
		const { error } = await supabaseAdmin
			.from("bet_reactions")
			.delete()
			.eq("bet_id", betId)
			.eq("user_id", userId)
			.eq("emoji", emoji);

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data: { success: true } };
	});

// Toggle a reaction (add if not exists, remove if exists)
export const toggleBetReaction = createServerFn({ method: "POST" })
	.inputValidator((data: { betId: string; emoji: string }) => data)
	.handler(async ({ data: { betId, emoji } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		// Validate emoji is in allowed list
		if (!REACTION_EMOJIS.includes(emoji as ReactionEmoji)) {
			return { error: "Invalid emoji", data: null };
		}

		// Verify user is a participant in the bet
		const { data: bet } = await supabaseAdmin
			.from("bets")
			.select("id")
			.eq("id", betId)
			.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
			.single();

		if (!bet) {
			return { error: "Bet not found or access denied", data: null };
		}

		// Check if reaction already exists
		const { data: existingReaction } = await supabaseAdmin
			.from("bet_reactions")
			.select("id")
			.eq("bet_id", betId)
			.eq("user_id", userId)
			.eq("emoji", emoji)
			.single();

		if (existingReaction) {
			// Remove the reaction
			const { error } = await supabaseAdmin
				.from("bet_reactions")
				.delete()
				.eq("id", existingReaction.id);

			if (error) {
				return { error: error.message, data: null };
			}

			return { error: null, data: { action: "removed" } };
		} else {
			// Add the reaction
			const { data, error } = await supabaseAdmin
				.from("bet_reactions")
				.insert({
					bet_id: betId,
					user_id: userId,
					emoji,
				})
				.select(
					`
					*,
					user:users!bet_reactions_user_id_fkey(id, username, display_name, avatar_url)
				`
				)
				.single();

			if (error) {
				return { error: error.message, data: null };
			}

			return { error: null, data: { action: "added", reaction: data } };
		}
	});
