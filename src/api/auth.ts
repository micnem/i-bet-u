import { createServerFn } from "@tanstack/react-start";
import { getAuth } from "@clerk/tanstack-react-start/server";
import { getWebRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/database.types";

// Sync current Clerk user to Supabase (called on dashboard load)
export const syncCurrentUser = createServerFn({ method: "POST" }).handler(
	async () => {
		const request = getWebRequest();
		const auth = await getAuth(request);

		if (!auth.userId) {
			return { error: "Not authenticated", data: null };
		}

		const supabaseUrl = process.env.SUPABASE_URL;
		const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

		if (!supabaseUrl || !supabaseServiceKey) {
			return { error: "Missing database credentials", data: null };
		}

		const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		});

		// Check if user already exists in Supabase
		const { data: existingUser } = await supabaseAdmin
			.from("users")
			.select("*")
			.eq("id", auth.userId)
			.single();

		if (existingUser) {
			return { error: null, data: existingUser };
		}

		// Fetch user details from Clerk
		const clerkSecretKey = process.env.CLERK_SECRET_KEY;
		if (!clerkSecretKey) {
			return { error: "Missing Clerk credentials", data: null };
		}

		const clerkResponse = await fetch(
			`https://api.clerk.com/v1/users/${auth.userId}`,
			{
				headers: {
					Authorization: `Bearer ${clerkSecretKey}`,
					"Content-Type": "application/json",
				},
			}
		);

		if (!clerkResponse.ok) {
			return { error: "Failed to fetch user from Clerk", data: null };
		}

		const clerkUser = await clerkResponse.json();

		const email = clerkUser.email_addresses?.[0]?.email_address || "";
		const displayName =
			[clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(" ") ||
			email.split("@")[0];
		const username =
			clerkUser.username || email.split("@")[0] + "_" + auth.userId.slice(-4);

		// Create user in Supabase
		const { data: newUser, error } = await supabaseAdmin
			.from("users")
			.insert({
				id: auth.userId,
				email: email,
				display_name: displayName,
				username: username,
				avatar_url: clerkUser.image_url,
			})
			.select()
			.single();

		if (error) {
			// If duplicate key, user was created by another request - fetch and return
			if (error.code === "23505") {
				const { data: existingUser } = await supabaseAdmin
					.from("users")
					.select("*")
					.eq("id", auth.userId)
					.single();
				return { error: null, data: existingUser };
			}
			return { error: error.message, data: null };
		}

		return { error: null, data: newUser };
	}
);

// Get current user from Supabase (after sync)
export const getCurrentUser = createServerFn({ method: "GET" }).handler(
	async () => {
		const request = getWebRequest();
		const auth = await getAuth(request);

		if (!auth.userId) {
			return { error: "Not authenticated", data: null };
		}

		const supabaseUrl = process.env.SUPABASE_URL;
		const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

		if (!supabaseUrl || !supabaseServiceKey) {
			return { error: "Missing database credentials", data: null };
		}

		const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		});

		const { data, error } = await supabaseAdmin
			.from("users")
			.select("*")
			.eq("id", auth.userId)
			.single();

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data };
	}
);
