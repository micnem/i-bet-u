// Database types for Supabase
// These types should match your Supabase database schema

export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type BetStatus = "pending" | "active" | "completed" | "declined" | "expired";
export type BetOutcome = "win" | "loss" | "pending" | "disputed";
export type VerificationMethod = "mutual_agreement" | "third_party" | "photo_proof" | "honor_system";
export type FriendRequestStatus = "pending" | "accepted" | "declined";

export interface Database {
	public: {
		Tables: {
			users: {
				Row: {
					id: string;
					username: string;
					display_name: string;
					email: string;
					phone_number: string | null;
					avatar_url: string | null;
					payment_link: string | null;
					total_bets: number;
					bets_won: number;
					bets_lost: number;
					email_notifications_enabled: boolean;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string; // Required: must match auth.users.id
					username: string;
					display_name: string;
					email: string;
					phone_number?: string | null;
					avatar_url?: string | null;
					payment_link?: string | null;
					total_bets?: number;
					bets_won?: number;
					bets_lost?: number;
					email_notifications_enabled?: boolean;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					username?: string;
					display_name?: string;
					email?: string;
					phone_number?: string | null;
					avatar_url?: string | null;
					payment_link?: string | null;
					total_bets?: number;
					bets_won?: number;
					bets_lost?: number;
					email_notifications_enabled?: boolean;
					updated_at?: string;
				};
			};
			friendships: {
				Row: {
					id: string;
					user_id: string;
					friend_id: string;
					status: FriendRequestStatus;
					added_via: "qr" | "phone" | "nickname";
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					friend_id: string;
					status?: FriendRequestStatus;
					added_via: "qr" | "phone" | "nickname";
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					status?: FriendRequestStatus;
					updated_at?: string;
				};
			};
			bets: {
				Row: {
					id: string;
					title: string;
					description: string;
					amount: number;
					currency: string;
					creator_id: string;
					opponent_id: string | null;
					status: BetStatus;
					outcome: BetOutcome | null;
					winner_id: string | null;
					verification_method: VerificationMethod;
					deadline: string;
					creator_approved: boolean;
					opponent_approved: boolean;
					share_token: string | null;
					created_at: string;
					accepted_at: string | null;
					resolved_at: string | null;
				};
				Insert: {
					id?: string;
					title: string;
					description: string;
					amount: number;
					currency?: string;
					creator_id: string;
					opponent_id?: string | null;
					status?: BetStatus;
					outcome?: BetOutcome | null;
					winner_id?: string | null;
					verification_method: VerificationMethod;
					deadline: string;
					creator_approved?: boolean;
					opponent_approved?: boolean;
					share_token?: string | null;
					created_at?: string;
					accepted_at?: string | null;
					resolved_at?: string | null;
				};
				Update: {
					title?: string;
					description?: string;
					amount?: number;
					opponent_id?: string | null;
					status?: BetStatus;
					outcome?: BetOutcome | null;
					winner_id?: string | null;
					creator_approved?: boolean;
					opponent_approved?: boolean;
					share_token?: string | null;
					accepted_at?: string | null;
					resolved_at?: string | null;
				};
			};
			payment_reminders: {
				Row: {
					id: string;
					sender_id: string;
					recipient_id: string;
					amount: number;
					created_at: string;
				};
				Insert: {
					id?: string;
					sender_id: string;
					recipient_id: string;
					amount: number;
					created_at?: string;
				};
				Update: {
					amount?: number;
				};
			};
			comments: {
				Row: {
					id: string;
					bet_id: string;
					author_id: string;
					content: string;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					bet_id: string;
					author_id: string;
					content: string;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					content?: string;
					updated_at?: string;
				};
			};
			bet_reactions: {
				Row: {
					id: string;
					bet_id: string;
					user_id: string;
					emoji: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					bet_id: string;
					user_id: string;
					emoji: string;
					created_at?: string;
				};
				Update: {
					emoji?: string;
				};
			};
			user_achievements: {
				Row: {
					id: string;
					user_id: string;
					achievement_id: string;
					unlocked_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					achievement_id: string;
					unlocked_at?: string;
				};
				Update: {
					unlocked_at?: string;
				};
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			bet_status: BetStatus;
			bet_outcome: BetOutcome;
			verification_method: VerificationMethod;
			friend_request_status: FriendRequestStatus;
		};
	};
}

// Convenience types for use in the application
export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export type Friendship = Database["public"]["Tables"]["friendships"]["Row"];
export type FriendshipInsert = Database["public"]["Tables"]["friendships"]["Insert"];

export type Bet = Database["public"]["Tables"]["bets"]["Row"];
export type BetInsert = Database["public"]["Tables"]["bets"]["Insert"];
export type BetUpdate = Database["public"]["Tables"]["bets"]["Update"];

export type PaymentReminder = Database["public"]["Tables"]["payment_reminders"]["Row"];
export type PaymentReminderInsert = Database["public"]["Tables"]["payment_reminders"]["Insert"];

export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type CommentInsert = Database["public"]["Tables"]["comments"]["Insert"];

export type BetReaction = Database["public"]["Tables"]["bet_reactions"]["Row"];
export type BetReactionInsert = Database["public"]["Tables"]["bet_reactions"]["Insert"];

// Extended types with relationships
export type BetWithUsers = Bet & {
	creator: User;
	opponent: User | null;
	winner?: User | null;
};

export type FriendshipWithUser = Friendship & {
	friend: User;
};

export type CommentWithAuthor = Comment & {
	author: User;
};

export type BetReactionWithUser = BetReaction & {
	user: User;
};

export type UserAchievement = Database["public"]["Tables"]["user_achievements"]["Row"];
export type UserAchievementInsert = Database["public"]["Tables"]["user_achievements"]["Insert"];
