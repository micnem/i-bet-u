import type { BetStatus } from "./database.types";

/**
 * Check if a bet's deadline has passed
 */
export function isDeadlinePassed(deadline: string): boolean {
	return new Date(deadline) < new Date();
}

/**
 * Get the display status for a bet, accounting for passed deadlines
 * Returns "deadline_passed" if the deadline has passed but the bet is still pending/active
 */
export type DisplayStatus = BetStatus | "deadline_passed";

export function getDisplayStatus(
	status: BetStatus,
	deadline: string,
): DisplayStatus {
	// Only show deadline_passed for pending or active bets
	if (
		(status === "pending" || status === "active") &&
		isDeadlinePassed(deadline)
	) {
		return "deadline_passed";
	}
	return status;
}
