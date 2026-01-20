// Deep linking and sharing utilities for IBetU

const APP_URL =
	typeof window !== "undefined"
		? window.location.origin
		: "https://ibetu-app.michael-nemni.workers.dev";

// Generate friend invite link using user ID (safe to share)
export function generateFriendInviteLink(userId: string): string {
	return `${APP_URL}/invite/${userId}`;
}

// Generate bet share link (for existing bets with opponent)
export function generateBetShareLink(betId: string): string {
	return `${APP_URL}/bets/${betId}`;
}

// Generate shareable bet invite link (for bets without opponent)
export function generateBetInviteLink(shareToken: string): string {
	return `${APP_URL}/bets/join/${shareToken}`;
}

// Generate friend profile link
export function generateProfileLink(username: string): string {
	return `${APP_URL}/user/${username}`;
}

// Generate leaderboard share link
export function generateLeaderboardLink(timeframe?: string): string {
	const base = `${APP_URL}/leaderboard`;
	return timeframe ? `${base}?timeframe=${timeframe}` : base;
}

// Parse invite link to get user ID
export function parseInviteLink(url: string): string | null {
	try {
		const urlObj = new URL(url);
		const match = urlObj.pathname.match(/\/invite\/([^/]+)/);
		return match ? match[1] : null;
	} catch {
		return null;
	}
}

// Parse bet link to get bet ID
export function parseBetLink(url: string): string | null {
	try {
		const urlObj = new URL(url);
		const match = urlObj.pathname.match(/\/bets\/([^/]+)/);
		return match ? match[1] : null;
	} catch {
		return null;
	}
}

// Parse bet invite link to get share token
export function parseBetInviteLink(url: string): string | null {
	try {
		const urlObj = new URL(url);
		const match = urlObj.pathname.match(/\/bets\/join\/([^/]+)/);
		return match ? match[1] : null;
	} catch {
		return null;
	}
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		// Fallback for older browsers
		try {
			const textarea = document.createElement("textarea");
			textarea.value = text;
			textarea.style.position = "fixed";
			textarea.style.opacity = "0";
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			document.body.removeChild(textarea);
			return true;
		} catch {
			return false;
		}
	}
}

// Share using Web Share API (mobile)
export async function shareLink(data: {
	title: string;
	text: string;
	url: string;
}): Promise<boolean> {
	if (navigator?.share) {
		try {
			await navigator.share(data);
			return true;
		} catch (_err) {
			// User cancelled or share failed
			return false;
		}
	}
	// Fallback to clipboard
	return copyToClipboard(data.url);
}

// Generate share data for friend invite
export function getFriendInviteShareData(userId: string, displayName: string) {
	return {
		title: "Add me on IBetU!",
		text: `${displayName} wants to be your friend on IBetU. Accept to start betting!`,
		url: generateFriendInviteLink(userId),
	};
}

// Generate share data for bet
export function getBetShareData(bet: {
	id: string;
	title: string;
	amount: number;
}) {
	return {
		title: `IBetU: ${bet.title}`,
		text: `Check out this $${bet.amount} bet on IBetU!`,
		url: generateBetShareLink(bet.id),
	};
}

// Generate share data for shareable bet invite
export function getBetInviteShareData(bet: {
	share_token: string;
	title: string;
	amount: number;
	creator_name: string;
}) {
	return {
		title: `${bet.creator_name} challenges you!`,
		text: `${bet.creator_name} wants to bet you $${bet.amount} on "${bet.title}" - accept the challenge on IBetU!`,
		url: generateBetInviteLink(bet.share_token),
	};
}

// Generate share data for leaderboard position
export function getLeaderboardShareData(rank: number, username: string) {
	return {
		title: "IBetU Leaderboard",
		text: `${username} is ranked #${rank} on IBetU! Can you beat them?`,
		url: generateLeaderboardLink(),
	};
}
