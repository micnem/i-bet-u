import { createServerFn } from "@tanstack/react-start";
import { supabase, supabaseAdmin } from "../lib/supabase";
import type { User, UserInsert, UserUpdate } from "../lib/database.types";

// Get current authenticated user's profile
export const getCurrentUserProfile = createServerFn({ method: "GET" }).handler(
	async () => {
		const {
			data: { user: authUser },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !authUser) {
			return { error: "Not authenticated", data: null };
		}

		const { data, error } = await supabase
			.from("users")
			.select("*")
			.eq("id", authUser.id)
			.single();

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data };
	}
);

// Get user by ID
export const getUserById = createServerFn({ method: "GET" })
	.validator((data: { userId: string }) => data)
	.handler(async ({ data: { userId } }) => {
		const { data, error } = await supabase
			.from("users")
			.select("*")
			.eq("id", userId)
			.single();

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data };
	});

// Get user by username
export const getUserByUsername = createServerFn({ method: "GET" })
	.validator((data: { username: string }) => data)
	.handler(async ({ data: { username } }) => {
		const { data, error } = await supabase
			.from("users")
			.select("*")
			.eq("username", username)
			.single();

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data };
	});

// Search users by username or display name
export const searchUsers = createServerFn({ method: "GET" })
	.validator((data: { query: string; limit?: number }) => data)
	.handler(async ({ data: { query, limit = 10 } }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		const { data, error } = await supabase
			.from("users")
			.select("*")
			.or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
			.neq("id", authUser.id)
			.limit(limit);

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data };
	});

// Search user by phone number
export const searchUserByPhone = createServerFn({ method: "GET" })
	.validator((data: { phoneNumber: string }) => data)
	.handler(async ({ data: { phoneNumber } }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		const { data, error } = await supabase
			.from("users")
			.select("*")
			.eq("phone_number", phoneNumber)
			.neq("id", authUser.id)
			.single();

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data };
	});

// Update current user's profile
export const updateUserProfile = createServerFn({ method: "POST" })
	.validator(
		(data: {
			displayName?: string;
			username?: string;
			phoneNumber?: string;
			avatarUrl?: string;
		}) => data
	)
	.handler(async ({ data }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		const updateData: UserUpdate = {};
		if (data.displayName) updateData.display_name = data.displayName;
		if (data.username) updateData.username = data.username;
		if (data.phoneNumber !== undefined)
			updateData.phone_number = data.phoneNumber;
		if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;

		const { data: updatedUser, error } = await supabase
			.from("users")
			.update(updateData)
			.eq("id", authUser.id)
			.select()
			.single();

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data: updatedUser };
	});

// Get user stats
export const getUserStats = createServerFn({ method: "GET" })
	.validator((data: { userId: string }) => data)
	.handler(async ({ data: { userId } }) => {
		const { data: user, error } = await supabase
			.from("users")
			.select("total_bets, bets_won, bets_lost, wallet_balance")
			.eq("id", userId)
			.single();

		if (error) {
			return { error: error.message, data: null };
		}

		const winRate =
			user.total_bets > 0
				? Math.round((user.bets_won / user.total_bets) * 100)
				: 0;

		return {
			error: null,
			data: {
				totalBets: user.total_bets,
				won: user.bets_won,
				lost: user.bets_lost,
				winRate,
				walletBalance: user.wallet_balance,
			},
		};
	});

// Check if username is available
export const checkUsernameAvailable = createServerFn({ method: "GET" })
	.validator((data: { username: string }) => data)
	.handler(async ({ data: { username } }) => {
		const { data, error } = await supabase
			.from("users")
			.select("id")
			.eq("username", username)
			.maybeSingle();

		if (error) {
			return { error: error.message, available: false };
		}

		return { error: null, available: data === null };
	});
