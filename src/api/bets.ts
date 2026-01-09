import { createServerFn } from "@tanstack/react-start";
import { supabase, supabaseAdmin } from "../lib/supabase";
import type {
	Bet,
	BetInsert,
	BetStatus,
	VerificationMethod,
} from "../lib/database.types";

// Get all bets for current user
export const getUserBets = createServerFn({ method: "GET" })
	.validator(
		(data: { status?: BetStatus; limit?: number; offset?: number }) => data
	)
	.handler(async ({ data: { status, limit = 50, offset = 0 } }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		let query = supabase
			.from("bets")
			.select(
				`
				*,
				creator:users!bets_creator_id_fkey(*),
				opponent:users!bets_opponent_id_fkey(*)
			`
			)
			.or(`creator_id.eq.${authUser.id},opponent_id.eq.${authUser.id}`)
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
	.validator((data: { betId: string }) => data)
	.handler(async ({ data: { betId } }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		const { data, error } = await supabase
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
			.or(`creator_id.eq.${authUser.id},opponent_id.eq.${authUser.id}`)
			.single();

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data };
	});

// Create a new bet
export const createBet = createServerFn({ method: "POST" })
	.validator(
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
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		// Check if user has sufficient balance
		const { data: userProfile } = await supabase
			.from("users")
			.select("wallet_balance")
			.eq("id", authUser.id)
			.single();

		if (!userProfile || userProfile.wallet_balance < data.amount) {
			return { error: "Insufficient wallet balance", data: null };
		}

		// Check if opponent exists and is a friend
		const { data: friendship } = await supabase
			.from("friendships")
			.select("id")
			.or(
				`and(user_id.eq.${authUser.id},friend_id.eq.${data.opponentId}),and(user_id.eq.${data.opponentId},friend_id.eq.${authUser.id})`
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
			creator_id: authUser.id,
			opponent_id: data.opponentId,
			deadline: data.deadline,
			verification_method: data.verificationMethod,
			status: "pending",
		};

		const { data: bet, error } = await supabase
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

		return { error: null, data: bet };
	});

// Accept a bet (as opponent)
export const acceptBet = createServerFn({ method: "POST" })
	.validator((data: { betId: string }) => data)
	.handler(async ({ data: { betId } }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		// Get the bet
		const { data: bet } = await supabase
			.from("bets")
			.select("*")
			.eq("id", betId)
			.eq("opponent_id", authUser.id)
			.eq("status", "pending")
			.single();

		if (!bet) {
			return { error: "Bet not found or already processed", data: null };
		}

		// Check opponent's balance
		const { data: userProfile } = await supabase
			.from("users")
			.select("wallet_balance")
			.eq("id", authUser.id)
			.single();

		if (!userProfile || userProfile.wallet_balance < bet.amount) {
			return { error: "Insufficient wallet balance", data: null };
		}

		// Start transaction: update bet, hold funds from both users
		// Note: In production, use a Supabase edge function for atomicity

		// Update bet status
		const { data: updatedBet, error: betError } = await supabase
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

		// Hold funds from creator
		await supabase.rpc("deduct_balance", {
			user_id: bet.creator_id,
			amount: bet.amount,
		});

		// Hold funds from opponent
		await supabase.rpc("deduct_balance", {
			user_id: authUser.id,
			amount: bet.amount,
		});

		// Create hold transactions
		await supabase.from("transactions").insert([
			{
				user_id: bet.creator_id,
				type: "bet_hold",
				amount: -bet.amount,
				bet_id: betId,
				description: `Hold for bet: ${bet.title}`,
			},
			{
				user_id: authUser.id,
				type: "bet_hold",
				amount: -bet.amount,
				bet_id: betId,
				description: `Hold for bet: ${bet.title}`,
			},
		]);

		return { error: null, data: updatedBet };
	});

// Decline a bet (as opponent)
export const declineBet = createServerFn({ method: "POST" })
	.validator((data: { betId: string }) => data)
	.handler(async ({ data: { betId } }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		const { data: bet, error } = await supabase
			.from("bets")
			.update({ status: "declined" })
			.eq("id", betId)
			.eq("opponent_id", authUser.id)
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
	.validator((data: { betId: string; winnerId: string }) => data)
	.handler(async ({ data: { betId, winnerId } }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		// Get the bet
		const { data: bet } = await supabase
			.from("bets")
			.select("*")
			.eq("id", betId)
			.eq("status", "active")
			.or(`creator_id.eq.${authUser.id},opponent_id.eq.${authUser.id}`)
			.single();

		if (!bet) {
			return { error: "Bet not found or not active", data: null };
		}

		// Validate winner is a participant
		if (winnerId !== bet.creator_id && winnerId !== bet.opponent_id) {
			return { error: "Invalid winner", data: null };
		}

		// Update approval
		const isCreator = authUser.id === bet.creator_id;
		const updateData = isCreator
			? { creator_approved: true, winner_id: winnerId }
			: { opponent_approved: true, winner_id: winnerId };

		const { data: updatedBet, error } = await supabase
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
		}

		return { error: null, data: updatedBet };
	});

// Internal function to resolve bet and distribute funds
async function resolveBet({
	betId,
	winnerId,
}: {
	betId: string;
	winnerId: string;
}) {
	const { data: bet } = await supabase
		.from("bets")
		.select("*")
		.eq("id", betId)
		.single();

	if (!bet) return;

	const loserId =
		winnerId === bet.creator_id ? bet.opponent_id : bet.creator_id;
	const totalPot = bet.amount * 2;

	// Update bet status
	await supabase
		.from("bets")
		.update({
			status: "completed",
			outcome: winnerId === bet.creator_id ? "win" : "loss",
			resolved_at: new Date().toISOString(),
		})
		.eq("id", betId);

	// Credit winner
	await supabase.rpc("add_balance", {
		user_id: winnerId,
		amount: totalPot,
	});

	// Update stats
	await supabase.rpc("increment_wins", { user_id: winnerId });
	await supabase.rpc("increment_losses", { user_id: loserId });

	// Create transaction records
	await supabase.from("transactions").insert([
		{
			user_id: winnerId,
			type: "bet_win",
			amount: totalPot,
			bet_id: betId,
			description: `Won bet: ${bet.title}`,
		},
		{
			user_id: loserId,
			type: "bet_loss",
			amount: 0, // Already deducted during hold
			bet_id: betId,
			description: `Lost bet: ${bet.title}`,
		},
	]);
}

// Cancel a pending bet (creator only)
export const cancelBet = createServerFn({ method: "POST" })
	.validator((data: { betId: string }) => data)
	.handler(async ({ data: { betId } }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		const { data: bet, error } = await supabase
			.from("bets")
			.update({ status: "expired" })
			.eq("id", betId)
			.eq("creator_id", authUser.id)
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
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		const { data, error } = await supabase
			.from("bets")
			.select(
				`
				*,
				creator:users!bets_creator_id_fkey(*)
			`
			)
			.eq("opponent_id", authUser.id)
			.eq("status", "pending")
			.order("created_at", { ascending: false });

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data };
	}
);

// Get active bets count
export const getActiveBetsCount = createServerFn({ method: "GET" }).handler(
	async () => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", count: 0 };
		}

		const { count, error } = await supabase
			.from("bets")
			.select("*", { count: "exact", head: true })
			.or(`creator_id.eq.${authUser.id},opponent_id.eq.${authUser.id}`)
			.eq("status", "active");

		if (error) {
			return { error: error.message, count: 0 };
		}

		return { error: null, count: count || 0 };
	}
);
