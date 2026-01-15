import { createServerClient } from "@supabase/ssr";
import { getCookies, setCookie } from "@tanstack/react-start/server";
import { supabaseAdmin } from "./supabase";
import type { User } from "./database.types";
import type { Database } from "./database.types";

// Get Supabase client with request cookies for server-side auth
// Based on: https://tanstack.com/start/latest/docs/framework/react/examples/start-supabase-basic
export function getSupabaseServerClient() {
	return createServerClient<Database>(
		process.env.SUPABASE_URL!,
		process.env.SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return Object.entries(getCookies()).map(([name, value]) => ({
						name,
						value,
					}));
				},
				setAll(cookies) {
					cookies.forEach((cookie) => {
						setCookie(cookie.name, cookie.value);
					});
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
	const cookies = getCookies();
	console.log("[getCurrentUser] cookies:", Object.keys(cookies));

	const supabase = getSupabaseServerClient();

	const {
		data: { user: authUser },
		error: authError,
	} = await supabase.auth.getUser();

	console.log("[getCurrentUser] authUser:", authUser?.id, "error:", authError?.message);

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
	const supabase = getSupabaseServerClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	return user?.id ?? null;
}
