// Email validation regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates an email address format
 * @param email - The email string to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
	if (!email || typeof email !== "string") {
		return false;
	}
	const trimmed = email.trim().toLowerCase();
	return EMAIL_REGEX.test(trimmed);
}

/**
 * Validates an OTP code format (6 digits)
 * @param otp - The OTP string to validate
 * @returns true if valid 6-digit code, false otherwise
 */
export function isValidOtp(otp: string): boolean {
	if (!otp || typeof otp !== "string") {
		return false;
	}
	const trimmed = otp.trim();
	return /^\d{6}$/.test(trimmed);
}

/**
 * Generates a username from email and user ID
 * @param email - User's email address
 * @param userId - User's ID (first 4 chars used as suffix)
 * @returns Generated username
 */
export function generateUsername(email: string, userId: string): string {
	const localPart = email.split("@")[0] || "user";
	const suffix = userId.slice(0, 4);
	return `${localPart}_${suffix}`;
}

/**
 * Extracts display name from email
 * @param email - User's email address
 * @returns Display name (local part before @)
 */
export function extractDisplayName(email: string): string {
	return email.split("@")[0] || "";
}

/**
 * Parses a full name into first and last name parts
 * @param displayName - Full display name
 * @returns Object with firstName and lastName
 */
export function parseDisplayName(displayName: string | null): {
	firstName: string | null;
	lastName: string | null;
} {
	if (!displayName) {
		return { firstName: null, lastName: null };
	}

	const parts = displayName.trim().split(" ");
	const firstName = parts[0] || null;
	const lastName = parts.slice(1).join(" ") || null;

	return { firstName, lastName };
}
