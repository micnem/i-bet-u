import { describe, expect, it } from "vitest";
import {
	extractDisplayName,
	generateUsername,
	isValidEmail,
	isValidOtp,
	parseDisplayName,
} from "./validation";

describe("isValidEmail", () => {
	it("returns true for valid email addresses", () => {
		expect(isValidEmail("test@example.com")).toBe(true);
		expect(isValidEmail("user.name@domain.org")).toBe(true);
		expect(isValidEmail("user+tag@example.co.uk")).toBe(true);
		expect(isValidEmail("  test@example.com  ")).toBe(true); // with whitespace
	});

	it("returns false for invalid email addresses", () => {
		expect(isValidEmail("")).toBe(false);
		expect(isValidEmail("invalid")).toBe(false);
		expect(isValidEmail("@example.com")).toBe(false);
		expect(isValidEmail("user@")).toBe(false);
		expect(isValidEmail("user@.com")).toBe(false);
		expect(isValidEmail("user example.com")).toBe(false);
		expect(isValidEmail("user@@example.com")).toBe(false);
	});

	it("handles edge cases", () => {
		expect(isValidEmail(null as unknown as string)).toBe(false);
		expect(isValidEmail(undefined as unknown as string)).toBe(false);
		expect(isValidEmail(123 as unknown as string)).toBe(false);
	});
});

describe("isValidOtp", () => {
	it("returns true for valid 6-digit OTP codes", () => {
		expect(isValidOtp("123456")).toBe(true);
		expect(isValidOtp("000000")).toBe(true);
		expect(isValidOtp("999999")).toBe(true);
		expect(isValidOtp("  123456  ")).toBe(true); // with whitespace
	});

	it("returns false for invalid OTP codes", () => {
		expect(isValidOtp("")).toBe(false);
		expect(isValidOtp("12345")).toBe(false); // too short
		expect(isValidOtp("1234567")).toBe(false); // too long
		expect(isValidOtp("12345a")).toBe(false); // contains letter
		expect(isValidOtp("12 345")).toBe(false); // contains space
		expect(isValidOtp("abcdef")).toBe(false); // all letters
	});

	it("handles edge cases", () => {
		expect(isValidOtp(null as unknown as string)).toBe(false);
		expect(isValidOtp(undefined as unknown as string)).toBe(false);
		expect(isValidOtp(123456 as unknown as string)).toBe(false);
	});
});

describe("generateUsername", () => {
	it("generates username from email and user ID", () => {
		expect(generateUsername("john@example.com", "abc123def")).toBe("john_abc1");
		expect(generateUsername("test.user@domain.org", "xyz789")).toBe(
			"test.user_xyz7",
		);
	});

	it("handles short user IDs", () => {
		expect(generateUsername("user@example.com", "ab")).toBe("user_ab");
		expect(generateUsername("user@example.com", "")).toBe("user_");
	});

	it("handles emails with complex local parts", () => {
		expect(generateUsername("user+tag@example.com", "1234")).toBe(
			"user+tag_1234",
		);
		expect(generateUsername("first.last@example.com", "5678")).toBe(
			"first.last_5678",
		);
	});
});

describe("extractDisplayName", () => {
	it("extracts local part from email", () => {
		expect(extractDisplayName("john@example.com")).toBe("john");
		expect(extractDisplayName("jane.doe@domain.org")).toBe("jane.doe");
	});

	it("handles edge cases", () => {
		expect(extractDisplayName("@example.com")).toBe("");
		expect(extractDisplayName("noatsign")).toBe("noatsign");
	});
});

describe("parseDisplayName", () => {
	it("parses single name", () => {
		const result = parseDisplayName("John");
		expect(result.firstName).toBe("John");
		expect(result.lastName).toBe(null);
	});

	it("parses first and last name", () => {
		const result = parseDisplayName("John Doe");
		expect(result.firstName).toBe("John");
		expect(result.lastName).toBe("Doe");
	});

	it("parses multiple name parts", () => {
		const result = parseDisplayName("John Van Der Berg");
		expect(result.firstName).toBe("John");
		expect(result.lastName).toBe("Van Der Berg");
	});

	it("handles null input", () => {
		const result = parseDisplayName(null);
		expect(result.firstName).toBe(null);
		expect(result.lastName).toBe(null);
	});

	it("handles empty string", () => {
		const result = parseDisplayName("");
		expect(result.firstName).toBe(null);
		expect(result.lastName).toBe(null);
	});

	it("trims whitespace", () => {
		const result = parseDisplayName("  John Doe  ");
		expect(result.firstName).toBe("John");
		expect(result.lastName).toBe("Doe");
	});
});
