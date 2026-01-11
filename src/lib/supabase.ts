import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Simple getEnv that uses process.env - should work with nodejs_compat flag
// and compatibility_date after 2025-04-01
function getEnv(key: string): string {
	return process.env[key] || "";
}

// Lazy initialization to avoid issues with module-level env access
let _supabase: SupabaseClient<Database> | null = null;
let _supabaseAdmin: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
	if (!_supabase) {
		const supabaseUrl = getEnv("SUPABASE_URL");
		const supabaseAnonKey = getEnv("SUPABASE_ANON_KEY");

		if (!supabaseUrl || !supabaseAnonKey) {
			console.warn(
				"Supabase credentials not found. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables."
			);
		}

		_supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
	}
	return _supabase;
}

export function getSupabaseAdmin(): SupabaseClient<Database> {
	if (!_supabaseAdmin) {
		const supabaseUrl = getEnv("SUPABASE_URL");
		const supabaseServiceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

		if (supabaseServiceKey) {
			_supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
				auth: {
					autoRefreshToken: false,
					persistSession: false,
				},
			});
		} else {
			// Fallback to regular client
			_supabaseAdmin = getSupabaseClient();
		}
	}
	return _supabaseAdmin;
}

// Legacy exports for backwards compatibility
// These are getters so they're evaluated lazily
export const supabase = new Proxy({} as SupabaseClient<Database>, {
	get(_, prop) {
		return (getSupabaseClient() as unknown as Record<string, unknown>)[
			prop as string
		];
	},
});

export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
	get(_, prop) {
		return (getSupabaseAdmin() as unknown as Record<string, unknown>)[
			prop as string
		];
	},
});

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
