import { createServerFn } from "@tanstack/react-start";
import { supabase } from "../lib/supabase";
import type { FriendshipInsert } from "../lib/database.types";

// Get all friends for current user
export const getFriends = createServerFn({ method: "GET" }).handler(async () => {
	const {
		data: { user: authUser },
	} = await supabase.auth.getUser();

	if (!authUser) {
		return { error: "Not authenticated", data: null };
	}

	// Get friendships where user is either the requester or the friend
	const { data, error } = await supabase
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
		.eq("user_id", authUser.id)
		.eq("status", "accepted");

	if (error) {
		return { error: error.message, data: null };
	}

	// Also get friendships where current user is the friend_id
	const { data: reverseFriendships, error: reverseError } = await supabase
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
		.eq("friend_id", authUser.id)
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
	const {
		data: { user: authUser },
	} = await supabase.auth.getUser();

	if (!authUser) {
		return { error: "Not authenticated", data: null };
	}

	const { data, error } = await supabase
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
		.eq("friend_id", authUser.id)
		.eq("status", "pending");

	if (error) {
		return { error: error.message, data: null };
	}

	return { error: null, data };
});

// Get sent friend requests
export const getSentFriendRequests = createServerFn({ method: "GET" }).handler(
	async () => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		const { data, error } = await supabase
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
			.eq("user_id", authUser.id)
			.eq("status", "pending");

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data };
	}
);

// Send friend request
export const sendFriendRequest = createServerFn({ method: "POST" })
	.validator(
		(data: { friendId: string; addedVia: "qr" | "phone" | "nickname" }) => data
	)
	.handler(async ({ data: { friendId, addedVia } }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		if (friendId === authUser.id) {
			return { error: "Cannot add yourself as a friend", data: null };
		}

		// Check if friendship already exists
		const { data: existing } = await supabase
			.from("friendships")
			.select("id, status")
			.or(
				`and(user_id.eq.${authUser.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${authUser.id})`
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
			user_id: authUser.id,
			friend_id: friendId,
			added_via: addedVia,
			status: "pending",
		};

		const { data: friendship, error } = await supabase
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
	.validator((data: { friendshipId: string }) => data)
	.handler(async ({ data: { friendshipId } }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		const { data: friendship, error } = await supabase
			.from("friendships")
			.update({ status: "accepted" })
			.eq("id", friendshipId)
			.eq("friend_id", authUser.id)
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
	.validator((data: { friendshipId: string }) => data)
	.handler(async ({ data: { friendshipId } }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		const { data: friendship, error } = await supabase
			.from("friendships")
			.update({ status: "declined" })
			.eq("id", friendshipId)
			.eq("friend_id", authUser.id)
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
	.validator((data: { friendId: string }) => data)
	.handler(async ({ data: { friendId } }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		// Delete friendship in either direction
		const { error } = await supabase
			.from("friendships")
			.delete()
			.or(
				`and(user_id.eq.${authUser.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${authUser.id})`
			);

		if (error) {
			return { error: error.message, success: false };
		}

		return { error: null, success: true };
	});

// Check if users are friends
export const checkFriendship = createServerFn({ method: "GET" })
	.validator((data: { userId: string }) => data)
	.handler(async ({ data: { userId } }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", isFriend: false, status: null };
		}

		const { data: friendship } = await supabase
			.from("friendships")
			.select("status")
			.or(
				`and(user_id.eq.${authUser.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${authUser.id})`
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
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", count: 0 };
		}

		const { count: count1 } = await supabase
			.from("friendships")
			.select("*", { count: "exact", head: true })
			.eq("user_id", authUser.id)
			.eq("status", "accepted");

		const { count: count2 } = await supabase
			.from("friendships")
			.select("*", { count: "exact", head: true })
			.eq("friend_id", authUser.id)
			.eq("status", "accepted");

		return { error: null, count: (count1 || 0) + (count2 || 0) };
	}
);
