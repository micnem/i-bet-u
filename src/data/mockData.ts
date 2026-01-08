// IBetU - Mock Data

import type {
	User,
	Friend,
	Bet,
	BetInvite,
	Transaction,
	PaymentMethod,
} from "./types";

// Current logged-in user
export const currentUser: User = {
	id: "user-1",
	username: "johndoe",
	displayName: "John Doe",
	phoneNumber: "+1 555-123-4567",
	email: "john@example.com",
	avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
	walletBalance: 567.0,
	createdAt: "2025-01-01T10:00:00Z",
	stats: {
		totalBets: 15,
		won: 9,
		lost: 6,
		winRate: 60,
	},
};

// Mock users (potential friends/opponents)
export const mockUsers: User[] = [
	{
		id: "user-2",
		username: "janedoe",
		displayName: "Jane Doe",
		phoneNumber: "+1 555-234-5678",
		email: "jane@example.com",
		avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
		walletBalance: 890.5,
		createdAt: "2025-01-05T14:30:00Z",
		stats: {
			totalBets: 22,
			won: 14,
			lost: 8,
			winRate: 64,
		},
	},
	{
		id: "user-3",
		username: "mikebrown",
		displayName: "Mike Brown",
		phoneNumber: "+1 555-345-6789",
		email: "mike@example.com",
		avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
		walletBalance: 234.0,
		createdAt: "2025-02-10T09:15:00Z",
		stats: {
			totalBets: 8,
			won: 3,
			lost: 5,
			winRate: 38,
		},
	},
	{
		id: "user-4",
		username: "sarahwilson",
		displayName: "Sarah Wilson",
		phoneNumber: "+1 555-456-7890",
		email: "sarah@example.com",
		avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
		walletBalance: 1250.0,
		createdAt: "2024-12-20T16:45:00Z",
		stats: {
			totalBets: 45,
			won: 28,
			lost: 17,
			winRate: 62,
		},
	},
	{
		id: "user-5",
		username: "alexjohnson",
		displayName: "Alex Johnson",
		phoneNumber: "+1 555-567-8901",
		email: "alex@example.com",
		avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
		walletBalance: 420.0,
		createdAt: "2025-01-15T11:20:00Z",
		stats: {
			totalBets: 12,
			won: 7,
			lost: 5,
			winRate: 58,
		},
	},
];

// Current user's friends
export const mockFriends: Friend[] = [
	{
		id: "friend-1",
		user: mockUsers[0], // Jane
		addedAt: "2025-01-10T12:00:00Z",
		addedVia: "phone",
	},
	{
		id: "friend-2",
		user: mockUsers[1], // Mike
		addedAt: "2025-02-15T15:30:00Z",
		addedVia: "qr",
	},
	{
		id: "friend-3",
		user: mockUsers[2], // Sarah
		addedAt: "2025-01-20T09:45:00Z",
		addedVia: "nickname",
	},
	{
		id: "friend-4",
		user: mockUsers[3], // Alex
		addedAt: "2025-03-01T14:00:00Z",
		addedVia: "qr",
	},
];

// Active and past bets
export const mockBets: Bet[] = [
	{
		id: "bet-1",
		title: "Lakers vs Celtics Game",
		description: "Lakers will win tonight's game against the Celtics",
		amount: 50,
		currency: "USD",
		creatorId: "user-1",
		opponentId: "user-2",
		creator: currentUser,
		opponent: mockUsers[0],
		status: "active",
		verificationMethod: "mutual_agreement",
		deadline: "2026-01-15T23:59:59Z",
		createdAt: "2026-01-08T10:00:00Z",
		acceptedAt: "2026-01-08T10:30:00Z",
	},
	{
		id: "bet-2",
		title: "Super Bowl Winner",
		description: "Chiefs will win the Super Bowl this year",
		amount: 100,
		currency: "USD",
		creatorId: "user-3",
		opponentId: "user-1",
		creator: mockUsers[1],
		opponent: currentUser,
		status: "active",
		verificationMethod: "third_party",
		deadline: "2026-02-10T23:59:59Z",
		createdAt: "2026-01-05T14:00:00Z",
		acceptedAt: "2026-01-05T16:00:00Z",
	},
	{
		id: "bet-3",
		title: "I'll finish the marathon",
		description: "I bet I can finish the NYC marathon under 4 hours",
		amount: 25,
		currency: "USD",
		creatorId: "user-1",
		opponentId: "user-4",
		creator: currentUser,
		opponent: mockUsers[2],
		status: "completed",
		outcome: "win",
		winnerId: "user-1",
		verificationMethod: "photo_proof",
		deadline: "2025-11-03T18:00:00Z",
		createdAt: "2025-10-01T09:00:00Z",
		acceptedAt: "2025-10-01T12:00:00Z",
		resolvedAt: "2025-11-03T15:45:00Z",
		creatorApproved: true,
		opponentApproved: true,
	},
	{
		id: "bet-4",
		title: "Who eats more hot wings",
		description: "Hot wing eating contest at Buffalo Wild Wings",
		amount: 30,
		currency: "USD",
		creatorId: "user-5",
		opponentId: "user-1",
		creator: mockUsers[3],
		opponent: currentUser,
		status: "completed",
		outcome: "loss",
		winnerId: "user-5",
		verificationMethod: "mutual_agreement",
		deadline: "2025-12-20T21:00:00Z",
		createdAt: "2025-12-15T10:00:00Z",
		acceptedAt: "2025-12-15T11:00:00Z",
		resolvedAt: "2025-12-20T20:30:00Z",
		creatorApproved: true,
		opponentApproved: true,
	},
	{
		id: "bet-5",
		title: "Rain tomorrow?",
		description: "It will rain more than 1 inch tomorrow in NYC",
		amount: 10,
		currency: "USD",
		creatorId: "user-1",
		opponentId: "user-3",
		creator: currentUser,
		opponent: mockUsers[1],
		status: "pending",
		verificationMethod: "third_party",
		deadline: "2026-01-10T23:59:59Z",
		createdAt: "2026-01-08T08:00:00Z",
	},
];

// Pending bet invites
export const mockBetInvites: BetInvite[] = [
	{
		id: "invite-1",
		bet: {
			id: "bet-pending-1",
			title: "You'll love this idea",
			description: "I bet you will love the IBetU app idea",
			amount: 10,
			currency: "USD",
			creatorId: "user-2",
			opponentId: "user-1",
			status: "pending",
			verificationMethod: "mutual_agreement",
			deadline: "2026-01-20T23:59:59Z",
			createdAt: "2026-01-08T09:00:00Z",
		},
		senderId: "user-2",
		receiverId: "user-1",
		sentAt: "2026-01-08T09:00:00Z",
		expiresAt: "2026-01-15T09:00:00Z",
		status: "pending",
	},
	{
		id: "invite-2",
		bet: {
			id: "bet-pending-2",
			title: "Movie night bet",
			description: "The new Marvel movie will score above 80% on Rotten Tomatoes",
			amount: 20,
			currency: "USD",
			creatorId: "user-4",
			opponentId: "user-1",
			status: "pending",
			verificationMethod: "third_party",
			deadline: "2026-02-01T23:59:59Z",
			createdAt: "2026-01-07T18:00:00Z",
		},
		senderId: "user-4",
		receiverId: "user-1",
		sentAt: "2026-01-07T18:00:00Z",
		expiresAt: "2026-01-14T18:00:00Z",
		status: "pending",
	},
];

// Transaction history
export const mockTransactions: Transaction[] = [
	{
		id: "txn-1",
		userId: "user-1",
		type: "deposit",
		amount: 500,
		description: "Initial deposit",
		createdAt: "2025-01-01T10:00:00Z",
	},
	{
		id: "txn-2",
		userId: "user-1",
		type: "bet_win",
		amount: 50,
		betId: "bet-3",
		description: "Won: Marathon bet",
		createdAt: "2025-11-03T15:45:00Z",
	},
	{
		id: "txn-3",
		userId: "user-1",
		type: "bet_loss",
		amount: -30,
		betId: "bet-4",
		description: "Lost: Hot wings contest",
		createdAt: "2025-12-20T20:30:00Z",
	},
	{
		id: "txn-4",
		userId: "user-1",
		type: "deposit",
		amount: 100,
		description: "Added funds",
		createdAt: "2026-01-02T11:00:00Z",
	},
	{
		id: "txn-5",
		userId: "user-1",
		type: "bet_hold",
		amount: -50,
		betId: "bet-1",
		description: "Hold: Lakers vs Celtics",
		createdAt: "2026-01-08T10:30:00Z",
	},
];

// Payment methods
export const mockPaymentMethods: PaymentMethod[] = [
	{
		id: "pm-1",
		userId: "user-1",
		type: "credit_card",
		last4: "4242",
		brand: "Visa",
		expiryMonth: 12,
		expiryYear: 2027,
		isDefault: true,
	},
	{
		id: "pm-2",
		userId: "user-1",
		type: "debit_card",
		last4: "8888",
		brand: "Mastercard",
		expiryMonth: 6,
		expiryYear: 2026,
		isDefault: false,
	},
];

// Helper function to get user by ID
export function getUserById(id: string): User | undefined {
	if (id === currentUser.id) return currentUser;
	return mockUsers.find((u) => u.id === id);
}

// Helper function to get friend by user ID
export function getFriendByUserId(userId: string): Friend | undefined {
	return mockFriends.find((f) => f.user.id === userId);
}

// Helper function to get bets for current user
export function getUserBets(userId: string): Bet[] {
	return mockBets.filter(
		(b) => b.creatorId === userId || b.opponentId === userId
	);
}

// Helper function to get active bets
export function getActiveBets(userId: string): Bet[] {
	return mockBets.filter(
		(b) =>
			(b.creatorId === userId || b.opponentId === userId) &&
			b.status === "active"
	);
}

// Helper function to get pending invites for user
export function getPendingInvites(userId: string): BetInvite[] {
	return mockBetInvites.filter(
		(i) => i.receiverId === userId && i.status === "pending"
	);
}
