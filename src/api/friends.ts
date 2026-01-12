import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "../lib/supabase";
import type { FriendshipInsert } from "../lib/database.types";
import { getCurrentUser } from "../lib/auth";

// Get all friends for current user
export const getFriends = createServerFn({ method: "GET" }).handler(async () => {
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		return { error: "Not authenticated", data: null };
	}

	const userId = currentUser.user.id;

	// Get friendships where user is either the requester or the friend
	const { data, error } = await supabaseAdmin
		.from("friendships")
		.select(
			`
			id,
			status,
			added_via,
			created_at,
			user_id,
			friend_id,
			friend:users!friendships_friend_id_fkey(*)
		`
		)
		.eq("user_id", userId)
		.eq("status", "accepted");

	if (error) {
		return { error: error.message, data: null };
	}

	// Also get friendships where current user is the friend_id
	const { data: reverseFriendships, error: reverseError } = await supabaseAdmin
		.from("friendships")
		.select(
			`
			id,
			status,
			added_via,
			created_at,
			user_id,
			friend_id,
			friend:users!friendships_user_id_fkey(*)
		`
		)
		.eq("friend_id", userId)
		.eq("status", "accepted");

	if (reverseError) {
		return { error: reverseError.message, data: null };
	}

	// Combine and dedupe
	const allFriends = [...(data || []), ...(reverseFriendships || [])];

	return { error: null, data: allFriends };
});

// Get pending friend requests (received)
export const getPendingFriendRequests = createServerFn({
	method: "GET",
}).handler(async () => {
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		return { error: "Not authenticated", data: null };
	}

	const userId = currentUser.user.id;

	const { data, error } = await supabaseAdmin
		.from("friendships")
		.select(
			`
			id,
			status,
			added_via,
			created_at,
			requester:users!friendships_user_id_fkey(*)
		`
		)
		.eq("friend_id", userId)
		.eq("status", "pending");

	if (error) {
		return { error: error.message, data: null };
	}

	return { error: null, data };
});

// Get sent friend requests
export const getSentFriendRequests = createServerFn({ method: "GET" }).handler(
	async () => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		const { data, error } = await supabaseAdmin
			.from("friendships")
			.select(
				`
				id,
				status,
				added_via,
				created_at,
				friend:users!friendships_friend_id_fkey(*)
			`
			)
			.eq("user_id", userId)
			.eq("status", "pending");

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data };
	}
);

// Add friend directly via invite link (auto-accepted)
export const addFriendViaInvite = createServerFn({ method: "POST" })
	.inputValidator((data: { friendId: string }) => data)
	.handler(async ({ data: { friendId } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		if (friendId === userId) {
			return { error: "Cannot add yourself as a friend", data: null };
		}

		// Check if friendship already exists
		const { data: existing } = await supabaseAdmin
			.from("friendships")
			.select("id, status")
			.or(
				`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`
			)
			.single();

		if (existing) {
			if (existing.status === "accepted") {
				return { error: null, data: existing, alreadyFriends: true };
			}
			// If pending or declined request exists, accept/update it
			if (existing.status === "pending" || existing.status === "declined") {
				const { data: updated, error } = await supabaseAdmin
					.from("friendships")
					.update({ status: "accepted" })
					.eq("id", existing.id)
					.select()
					.single();

				if (error) {
					return { error: error.message, data: null };
				}
				return { error: null, data: updated, alreadyFriends: false };
			}
		}

		// Create friendship with accepted status (invite link = mutual consent)
		const friendshipInsert: FriendshipInsert = {
			user_id: userId,
			friend_id: friendId,
			added_via: "qr",
			status: "accepted",
		};

		const { data: friendship, error } = await supabaseAdmin
			.from("friendships")
			.insert(friendshipInsert)
			.select(
				`
				*,
				friend:users!friendships_friend_id_fkey(*)
			`
			)
			.single();

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data: friendship, alreadyFriends: false };
	});

// Send friend request
export const sendFriendRequest = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { friendId: string; addedVia: "qr" | "phone" | "nickname" }) => data
	)
	.handler(async ({ data: { friendId, addedVia } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		if (friendId === userId) {
			return { error: "Cannot add yourself as a friend", data: null };
		}

		// Check if friendship already exists
		const { data: existing } = await supabaseAdmin
			.from("friendships")
			.select("id, status")
			.or(
				`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`
			)
			.single();

		if (existing) {
			if (existing.status === "accepted") {
				return { error: "Already friends", data: null };
			}
			if (existing.status === "pending") {
				return { error: "Friend request already pending", data: null };
			}
		}

		// Create friend request
		const friendshipInsert: FriendshipInsert = {
			user_id: userId,
			friend_id: friendId,
			added_via: addedVia,
			status: "pending",
		};

		const { data: friendship, error } = await supabaseAdmin
			.from("friendships")
			.insert(friendshipInsert)
			.select(
				`
				*,
				friend:users!friendships_friend_id_fkey(*)
			`
			)
			.single();

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data: friendship };
	});

// Accept friend request
export const acceptFriendRequest = createServerFn({ method: "POST" })
	.inputValidator((data: { friendshipId: string }) => data)
	.handler(async ({ data: { friendshipId } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		const { data: friendship, error } = await supabaseAdmin
			.from("friendships")
			.update({ status: "accepted" })
			.eq("id", friendshipId)
			.eq("friend_id", userId)
			.eq("status", "pending")
			.select()
			.single();

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data: friendship };
	});

// Decline friend request
export const declineFriendRequest = createServerFn({ method: "POST" })
	.inputValidator((data: { friendshipId: string }) => data)
	.handler(async ({ data: { friendshipId } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		const { data: friendship, error } = await supabaseAdmin
			.from("friendships")
			.update({ status: "declined" })
			.eq("id", friendshipId)
			.eq("friend_id", userId)
			.eq("status", "pending")
			.select()
			.single();

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data: friendship };
	});

// Remove friend
export const removeFriend = createServerFn({ method: "POST" })
	.inputValidator((data: { friendId: string }) => data)
	.handler(async ({ data: { friendId } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", success: false };
		}

		const userId = currentUser.user.id;

		// Delete friendship in either direction
		const { error } = await supabaseAdmin
			.from("friendships")
			.delete()
			.or(
				`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`
			);

		if (error) {
			return { error: error.message, success: false };
		}

		return { error: null, success: true };
	});

// Check if users are friends
export const checkFriendship = createServerFn({ method: "GET" })
	.inputValidator((data: { userId: string }) => data)
	.handler(async ({ data: { userId: targetUserId } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", isFriend: false, status: null };
		}

		const userId = currentUser.user.id;

		const { data: friendship } = await supabaseAdmin
			.from("friendships")
			.select("status")
			.or(
				`and(user_id.eq.${userId},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${userId})`
			)
			.single();

		return {
			error: null,
			isFriend: friendship?.status === "accepted",
			status: friendship?.status || null,
		};
	});

// Get friends count
export const getFriendsCount = createServerFn({ method: "GET" }).handler(
	async () => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", count: 0 };
		}

		const userId = currentUser.user.id;

		const { count: count1 } = await supabaseAdmin
			.from("friendships")
			.select("*", { count: "exact", head: true })
			.eq("user_id", userId)
			.eq("status", "accepted");

		const { count: count2 } = await supabaseAdmin
			.from("friendships")
			.select("*", { count: "exact", head: true })
			.eq("friend_id", userId)
			.eq("status", "accepted");

		return { error: null, count: (count1 || 0) + (count2 || 0) };
	}
);
