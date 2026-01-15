import {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	type ReactNode,
} from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";
import type { User } from "../lib/database.types";
import {
	generateUsername,
	extractDisplayName,
	parseDisplayName,
} from "../lib/validation";

interface AuthContextType {
	session: Session | null;
	user: SupabaseUser | null;
	profile: User | null;
	isLoading: boolean;
	signOut: () => Promise<void>;
	refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
	children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [session, setSession] = useState<Session | null>(null);
	const [user, setUser] = useState<SupabaseUser | null>(null);
	const [profile, setProfile] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isClient, setIsClient] = useState(false);

	// Only get supabase client on the client side
	const supabase = isClient ? getSupabaseBrowserClient() : null;

	// Detect client-side
	useEffect(() => {
		setIsClient(true);
	}, []);

	const fetchProfile = useCallback(
		async (userId: string, accessToken?: string) => {
			try {
				const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=*`;

				// Use access token if provided, otherwise use anon key
				const authToken = accessToken || import.meta.env.VITE_SUPABASE_ANON_KEY;

				const response = await fetch(url, {
					headers: {
						apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
						Authorization: `Bearer ${authToken}`,
					},
				});

				const data = await response.json();

				if (data && data.length > 0) {
					return data[0] as User;
				}

				return null;
			} catch (err) {
				console.error("Exception fetching profile:", err);
				return null;
			}
		},
		[]
	);

	const createProfile = useCallback(
		async (authUser: SupabaseUser, accessToken: string) => {
			const email = authUser.email || "";
			const username = generateUsername(email, authUser.id);
			const displayName = extractDisplayName(email);

			try {
				const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users`;

				const response = await fetch(url, {
					method: "POST",
					headers: {
						apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
						Authorization: `Bearer ${accessToken}`,
						"Content-Type": "application/json",
						Prefer: "return=representation",
					},
					body: JSON.stringify({
						id: authUser.id,
						email,
						username,
						display_name: displayName,
					}),
				});

				const data = await response.json();

				if (!response.ok) {
					console.error("Error creating profile:", data);
					return null;
				}

				return (data && data.length > 0 ? data[0] : data) as User;
			} catch (err) {
				console.error("Exception creating profile:", err);
				return null;
			}
		},
		[]
	);

	const refreshProfile = useCallback(async () => {
		if (!user || !session?.access_token) return;
		const newProfile = await fetchProfile(user.id, session.access_token);
		if (newProfile) {
			setProfile(newProfile);
		}
	}, [user, session, fetchProfile]);

	const signOut = useCallback(async () => {
		if (!supabase) return;
		await supabase.auth.signOut();
		setSession(null);
		setUser(null);
		setProfile(null);
	}, [supabase]);

	useEffect(() => {
		// Only run on client side when supabase is available
		if (!supabase) return;

		// Get initial session
		supabase.auth.getSession().then(async ({ data: { session } }) => {
			setSession(session);
			setUser(session?.user ?? null);

			if (session?.user && session.access_token) {
				// Try to fetch existing profile using access token for RLS
				let userProfile = await fetchProfile(session.user.id, session.access_token);

				// If no profile exists, create one
				if (!userProfile) {
					userProfile = await createProfile(session.user, session.access_token);
				}

				setProfile(userProfile);
			}

			setIsLoading(false);
		});

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			setSession(session);
			setUser(session?.user ?? null);

			if (session?.user && session.access_token) {
				// Try to fetch existing profile using access token for RLS
				let userProfile = await fetchProfile(session.user.id, session.access_token);

				// If no profile exists, create one (for new sign ups or after DB reset)
				if (!userProfile) {
					userProfile = await createProfile(session.user, session.access_token);
				}

				setProfile(userProfile);
			} else {
				setProfile(null);
			}

			setIsLoading(false);
		});

		return () => {
			subscription.unsubscribe();
		};
	}, [supabase, fetchProfile, createProfile]);

	return (
		<AuthContext.Provider
			value={{
				session,
				user,
				profile,
				isLoading,
				signOut,
				refreshProfile,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

// Main hook for auth state
export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}

// Compatible hook with Clerk's useUser shape
export function useUser() {
	const { user, profile, isLoading, session } = useAuth();

	// isSignedIn is true when we have a session, regardless of profile loading state
	const isSignedIn = !!session && !!user;

	if (!profile) {
		return {
			user: null,
			isSignedIn,
			isLoaded: !isLoading,
		};
	}

	const { firstName, lastName } = parseDisplayName(profile.display_name);

	return {
		user: {
			id: profile.id,
			firstName,
			lastName,
			username: profile.username,
			imageUrl: profile.avatar_url,
			primaryEmailAddress: {
				emailAddress: profile.email,
			},
			// Raw profile for direct access
			profile,
		},
		isSignedIn,
		isLoaded: !isLoading,
	};
}
