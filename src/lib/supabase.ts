import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Cache for Cloudflare env - loaded at module initialization
let cfEnvCache: Record<string, string> | null = null;

// Load Cloudflare env at module initialization (top-level await)
try {
	// @ts-expect-error - cloudflare:workers is a virtual module only available at runtime
	const cfModule = await import("cloudflare:workers");
	cfEnvCache = cfModule.env as Record<string, string>;
} catch {
	// Not in Cloudflare environment, will use process.env fallback
}

function getEnv(key: string): string {
	// Check cached Cloudflare env
	if (cfEnvCache?.[key]) {
		return cfEnvCache[key];
	}
	// Fallback to process.env (works in Node.js and with nodejs_compat flag)
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
