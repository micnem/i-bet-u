import { auth } from "@clerk/tanstack-react-start/server";
import { supabaseAdmin } from "./supabase";
import type { User } from "./database.types";

// Get current authenticated user from Clerk and their Supabase record
export async function getCurrentUser(): Promise<{
	clerkId: string;
	user: User;
} | null> {
	const { userId: clerkId } = await auth();

	if (!clerkId) {
		return null;
	}

	const { data: user, error } = await supabaseAdmin
		.from("users")
		.select("*")
		.eq("clerk_id", clerkId)
		.single();

	if (error || !user) {
		return null;
	}

	return { clerkId, user };
}

// Get just the clerk ID for quick auth checks
export async function getClerkId(): Promise<string | null> {
	const { userId } = await auth();
	return userId;
}
