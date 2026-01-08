import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
	console.warn(
		"Supabase credentials not found. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables."
	);
}

// Client for browser (uses anon key, respects RLS)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Server client with service role for admin operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabaseAdmin = supabaseServiceKey
	? createClient<Database>(supabaseUrl, supabaseServiceKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		})
	: supabase;

// Helper to get user from session
export async function getCurrentUser() {
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();
	if (error || !user) return null;
	return user;
}

// Helper to get user profile from database
export async function getUserProfile(userId: string) {
	const { data, error } = await supabase
		.from("users")
		.select("*")
		.eq("id", userId)
		.single();

	if (error) return null;
	return data;
}
