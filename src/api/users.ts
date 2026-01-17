import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "../lib/supabase";
import type { User, UserInsert, UserUpdate } from "../lib/database.types";
import { getCurrentUser } from "../lib/auth";

// Get current authenticated user's profile
export const getCurrentUserProfile = createServerFn({ method: "GET" }).handler(
	async () => {
		try {
			const currentUser = await getCurrentUser();

			if (!currentUser) {
				return { error: "Not authenticated", data: null };
			}

			return { error: null, data: currentUser.user };
		} catch (err) {
			console.error("getCurrentUserProfile error:", err);
			return { error: err instanceof Error ? err.message : "Unknown error", data: null };
		}
	}
);

// Get user by ID
export const getUserById = createServerFn({ method: "GET" })
	.inputValidator((data: { userId: string }) => data)
	.handler(async ({ data: { userId } }) => {
		const { data, error } = await supabaseAdmin
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
	.inputValidator((data: { username: string }) => data)
	.handler(async ({ data: { username } }) => {
		const { data, error } = await supabaseAdmin
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
	.inputValidator((data: { query: string; limit?: number }) => data)
	.handler(async ({ data: { query, limit = 10 } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		const { data, error } = await supabaseAdmin
			.from("users")
			.select("*")
			.or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
			.neq("id", userId)
			.limit(limit);

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data };
	});

// Search user by phone number
export const searchUserByPhone = createServerFn({ method: "GET" })
	.inputValidator((data: { phoneNumber: string }) => data)
	.handler(async ({ data: { phoneNumber } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		const { data, error } = await supabaseAdmin
			.from("users")
			.select("*")
			.eq("phone_number", phoneNumber)
			.neq("id", userId)
			.single();

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data };
	});

// Update current user's profile
export const updateUserProfile = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			displayName?: string;
			username?: string;
			phoneNumber?: string;
			avatarUrl?: string;
		}) => data
	)
	.handler(async ({ data }) => {
		try {
			const currentUser = await getCurrentUser();

			if (!currentUser) {
				return { error: "Not authenticated", data: null };
			}

			const userId = currentUser.user.id;

			const updateData: UserUpdate = {};
			if (data.displayName) updateData.display_name = data.displayName;
			if (data.username) updateData.username = data.username;
			if (data.phoneNumber !== undefined)
				updateData.phone_number = data.phoneNumber;
			if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;

			const { data: updatedUser, error } = await supabaseAdmin
				.from("users")
				.update(updateData)
				.eq("id", userId)
				.select()
				.single();

			if (error) {
				console.error("updateUserProfile Supabase error:", error);
				return { error: error.message, data: null };
			}

			return { error: null, data: updatedUser };
		} catch (err) {
			console.error("updateUserProfile error:", err);
			return { error: err instanceof Error ? err.message : "Unknown error", data: null };
		}
	});

// Get user stats
export const getUserStats = createServerFn({ method: "GET" })
	.inputValidator((data: { userId: string }) => data)
	.handler(async ({ data: { userId } }) => {
		const { data: user, error } = await supabaseAdmin
			.from("users")
			.select("total_bets, bets_won, bets_lost")
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
			},
		};
	});

// Check if username is available
export const checkUsernameAvailable = createServerFn({ method: "GET" })
	.inputValidator((data: { username: string }) => data)
	.handler(async ({ data: { username } }) => {
		const { data, error } = await supabaseAdmin
			.from("users")
			.select("id")
			.eq("username", username)
			.maybeSingle();

		if (error) {
			return { error: error.message, available: false };
		}

		return { error: null, available: data === null };
	});
