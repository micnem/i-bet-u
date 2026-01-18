import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";

export interface Notification {
	id: string;
	type: "friend_request" | "bet_invitation" | "bet_resolution";
	title: string;
	message: string;
	createdAt: string;
	actionUrl: string;
	data: {
		friendshipId?: string;
		betId?: string;
		fromUser?: {
			id: string;
			display_name: string;
			avatar_url: string | null;
		};
	};
}

export interface NotificationCounts {
	friendRequests: number;
	betInvitations: number;
	betResolutions: number;
	total: number;
}

// Get all notifications for current user
export const getNotifications = createServerFn({ method: "GET" }).handler(
	async () => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;
		const notifications: Notification[] = [];

		// 1. Get pending friend requests (received)
		const { data: friendRequests } = await supabaseAdmin
			.from("friendships")
			.select(
				`
				id,
				created_at,
				requester:users!friendships_user_id_fkey(id, display_name, avatar_url)
			`
			)
			.eq("friend_id", userId)
			.eq("status", "pending")
			.order("created_at", { ascending: false });

		if (friendRequests) {
			for (const request of friendRequests) {
				const requester = request.requester as {
					id: string;
					display_name: string;
					avatar_url: string | null;
				};
				notifications.push({
					id: `friend_${request.id}`,
					type: "friend_request",
					title: "Friend Request",
					message: `${requester.display_name} wants to be your friend`,
					createdAt: request.created_at,
					actionUrl: "/friends",
					data: {
						friendshipId: request.id,
						fromUser: requester,
					},
				});
			}
		}

		// 2. Get pending bet invitations (where user is opponent)
		const { data: betInvitations } = await supabaseAdmin
			.from("bets")
			.select(
				`
				id,
				title,
				amount,
				created_at,
				creator:users!bets_creator_id_fkey(id, display_name, avatar_url)
			`
			)
			.eq("opponent_id", userId)
			.eq("status", "pending")
			.order("created_at", { ascending: false });

		if (betInvitations) {
			for (const bet of betInvitations) {
				const creator = bet.creator as {
					id: string;
					display_name: string;
					avatar_url: string | null;
				};
				notifications.push({
					id: `bet_invite_${bet.id}`,
					type: "bet_invitation",
					title: "Bet Invitation",
					message: `${creator.display_name} challenged you to "${bet.title}" for $${bet.amount}`,
					createdAt: bet.created_at,
					actionUrl: `/bets/${bet.id}`,
					data: {
						betId: bet.id,
						fromUser: creator,
					},
				});
			}
		}

		// 3. Get bets awaiting resolution confirmation (where the other party has declared a winner)
		const { data: pendingResolutions } = await supabaseAdmin
			.from("bets")
			.select(
				`
				id,
				title,
				amount,
				creator_id,
				opponent_id,
				creator_approved,
				opponent_approved,
				winner_id,
				updated_at,
				creator:users!bets_creator_id_fkey(id, display_name, avatar_url),
				opponent:users!bets_opponent_id_fkey(id, display_name, avatar_url),
				winner:users!bets_winner_id_fkey(id, display_name)
			`
			)
			.eq("status", "active")
			.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
			.not("winner_id", "is", null)
			.order("updated_at", { ascending: false });

		if (pendingResolutions) {
			for (const bet of pendingResolutions) {
				const isCreator = bet.creator_id === userId;
				const hasApproved = isCreator
					? bet.creator_approved
					: bet.opponent_approved;

				// Only show if user hasn't approved yet (other party declared winner first)
				if (!hasApproved) {
					const declarer = isCreator
						? (bet.opponent as {
								id: string;
								display_name: string;
								avatar_url: string | null;
							})
						: (bet.creator as {
								id: string;
								display_name: string;
								avatar_url: string | null;
							});
					const winner = bet.winner as { id: string; display_name: string };

					notifications.push({
						id: `bet_resolution_${bet.id}`,
						type: "bet_resolution",
						title: "Confirm Winner",
						message: `${declarer.display_name} declared ${winner.display_name} as winner of "${bet.title}"`,
						createdAt: bet.updated_at,
						actionUrl: `/bets/${bet.id}`,
						data: {
							betId: bet.id,
							fromUser: declarer,
						},
					});
				}
			}
		}

		// Sort all notifications by date (most recent first)
		notifications.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);

		return { error: null, data: notifications };
	}
);

// Get notification counts only (lightweight)
export const getNotificationCounts = createServerFn({ method: "GET" }).handler(
	async () => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return {
				error: "Not authenticated",
				data: { friendRequests: 0, betInvitations: 0, betResolutions: 0, total: 0 },
			};
		}

		const userId = currentUser.user.id;

		// Count pending friend requests
		const { count: friendRequestCount } = await supabaseAdmin
			.from("friendships")
			.select("*", { count: "exact", head: true })
			.eq("friend_id", userId)
			.eq("status", "pending");

		// Count pending bet invitations
		const { count: betInvitationCount } = await supabaseAdmin
			.from("bets")
			.select("*", { count: "exact", head: true })
			.eq("opponent_id", userId)
			.eq("status", "pending");

		// Count bets awaiting resolution confirmation
		// This is more complex - need to check if user hasn't approved yet
		const { data: pendingResolutions } = await supabaseAdmin
			.from("bets")
			.select("id, creator_id, creator_approved, opponent_approved")
			.eq("status", "active")
			.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
			.not("winner_id", "is", null);

		let betResolutionCount = 0;
		if (pendingResolutions) {
			for (const bet of pendingResolutions) {
				const isCreator = bet.creator_id === userId;
				const hasApproved = isCreator
					? bet.creator_approved
					: bet.opponent_approved;
				if (!hasApproved) {
					betResolutionCount++;
				}
			}
		}

		const total =
			(friendRequestCount || 0) +
			(betInvitationCount || 0) +
			betResolutionCount;

		return {
			error: null,
			data: {
				friendRequests: friendRequestCount || 0,
				betInvitations: betInvitationCount || 0,
				betResolutions: betResolutionCount,
				total,
			},
		};
	}
);
