// IBetU - Types and Interfaces

export type BetStatus = "pending" | "active" | "completed" | "declined" | "expired";
export type BetOutcome = "win" | "loss" | "pending" | "disputed";
export type VerificationMethod = "mutual_agreement" | "third_party" | "photo_proof" | "honor_system";

export interface User {
	id: string;
	username: string;
	displayName: string;
	phoneNumber?: string;
	email: string;
	avatar?: string;
	walletBalance: number;
	createdAt: string;
	stats: {
		totalBets: number;
		won: number;
		lost: number;
		winRate: number;
	};
}

export interface Friend {
	id: string;
	user: User;
	addedAt: string;
	addedVia: "qr" | "phone" | "nickname";
}

export interface Bet {
	id: string;
	title: string;
	description: string;
	amount: number;
	currency: string;
	creatorId: string;
	opponentId: string;
	creator?: User;
	opponent?: User;
	status: BetStatus;
	outcome?: BetOutcome;
	winnerId?: string;
	verificationMethod: VerificationMethod;
	deadline: string;
	createdAt: string;
	acceptedAt?: string;
	resolvedAt?: string;
	creatorApproved?: boolean;
	opponentApproved?: boolean;
}

export interface BetInvite {
	id: string;
	bet: Bet;
	senderId: string;
	receiverId: string;
	sentAt: string;
	expiresAt: string;
	status: "pending" | "accepted" | "declined" | "expired";
}

export interface Transaction {
	id: string;
	userId: string;
	type: "deposit" | "withdrawal" | "bet_win" | "bet_loss" | "bet_hold";
	amount: number;
	betId?: string;
	description: string;
	createdAt: string;
}

export interface PaymentMethod {
	id: string;
	userId: string;
	type: "credit_card" | "debit_card";
	last4: string;
	brand: string;
	expiryMonth: number;
	expiryYear: number;
	isDefault: boolean;
}
