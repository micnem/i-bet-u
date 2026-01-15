import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { supabaseAdmin } from "./supabase";
import type { User } from "./database.types";
import type { Database } from "./database.types";

// Get Supabase client with request cookies for server-side auth
function getServerSupabaseClient() {
	const headers = getRequestHeaders();
	const cookies = parseCookieHeader(headers?.cookie ?? "");

	return createServerClient<Database>(
		process.env.SUPABASE_URL!,
		process.env.SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return cookies;
				},
				setAll() {
					// Note: This is for reading only in server functions
					// Cookie setting is handled by the browser client
				},
			},
		}
	);
}

// Get current authenticated user from Supabase Auth and their profile
export async function getCurrentUser(): Promise<{
	authUserId: string;
	user: User;
} | null> {
	const supabase = getServerSupabaseClient();

	const {
		data: { user: authUser },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !authUser) {
		return null;
	}

	const { data: user, error } = await supabaseAdmin
		.from("users")
		.select("*")
		.eq("id", authUser.id)
		.single();

	if (error || !user) {
		return null;
	}

	return { authUserId: authUser.id, user };
}

// Get just the auth user ID for quick auth checks
export async function getAuthUserId(): Promise<string | null> {
	const supabase = getServerSupabaseClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	return user?.id ?? null;
}
