import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
	// Only create client on the browser
	if (typeof window === "undefined") {
		throw new Error("getSupabaseBrowserClient can only be called on the client side");
	}

	if (browserClient) {
		return browserClient;
	}

	// Try VITE_ env vars (client-side) first, fall back to process.env (SSR)
	const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
	const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error(
			"Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
		);
	}

	browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

	return browserClient;
}
