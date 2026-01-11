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
export type TransactionType = "deposit" | "withdrawal" | "bet_win" | "bet_loss" | "bet_hold" | "bet_refund";
export type FriendRequestStatus = "pending" | "accepted" | "declined";

export interface Database {
	public: {
		Tables: {
			users: {
				Row: {
					id: string;
					clerk_id: string;
					username: string;
					display_name: string;
					email: string;
					phone_number: string | null;
					avatar_url: string | null;
					wallet_balance: number;
					total_bets: number;
					bets_won: number;
					bets_lost: number;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					clerk_id: string;
					username: string;
					display_name: string;
					email: string;
					phone_number?: string | null;
					avatar_url?: string | null;
					wallet_balance?: number;
					total_bets?: number;
					bets_won?: number;
					bets_lost?: number;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					clerk_id?: string;
					username?: string;
					display_name?: string;
					email?: string;
					phone_number?: string | null;
					avatar_url?: string | null;
					wallet_balance?: number;
					total_bets?: number;
					bets_won?: number;
					bets_lost?: number;
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
					opponent_id: string;
					status: BetStatus;
					outcome: BetOutcome | null;
					winner_id: string | null;
					verification_method: VerificationMethod;
					deadline: string;
					creator_approved: boolean;
					opponent_approved: boolean;
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
					opponent_id: string;
					status?: BetStatus;
					outcome?: BetOutcome | null;
					winner_id?: string | null;
					verification_method: VerificationMethod;
					deadline: string;
					creator_approved?: boolean;
					opponent_approved?: boolean;
					created_at?: string;
					accepted_at?: string | null;
					resolved_at?: string | null;
				};
				Update: {
					title?: string;
					description?: string;
					amount?: number;
					status?: BetStatus;
					outcome?: BetOutcome | null;
					winner_id?: string | null;
					creator_approved?: boolean;
					opponent_approved?: boolean;
					accepted_at?: string | null;
					resolved_at?: string | null;
				};
			};
			transactions: {
				Row: {
					id: string;
					user_id: string;
					type: TransactionType;
					amount: number;
					bet_id: string | null;
					description: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					type: TransactionType;
					amount: number;
					bet_id?: string | null;
					description: string;
					created_at?: string;
				};
				Update: {
					description?: string;
				};
			};
			payment_methods: {
				Row: {
					id: string;
					user_id: string;
					type: "credit_card" | "debit_card";
					last4: string;
					brand: string;
					expiry_month: number;
					expiry_year: number;
					is_default: boolean;
					stripe_payment_method_id: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					type: "credit_card" | "debit_card";
					last4: string;
					brand: string;
					expiry_month: number;
					expiry_year: number;
					is_default?: boolean;
					stripe_payment_method_id?: string | null;
					created_at?: string;
				};
				Update: {
					is_default?: boolean;
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
			transaction_type: TransactionType;
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

export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];

export type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];
export type PaymentMethodInsert = Database["public"]["Tables"]["payment_methods"]["Insert"];

// Extended types with relationships
export type BetWithUsers = Bet & {
	creator: User;
	opponent: User;
	winner?: User | null;
};

export type FriendshipWithUser = Friendship & {
	friend: User;
};
