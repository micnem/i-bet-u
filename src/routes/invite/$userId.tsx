import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { Users, UserPlus, Check, Clock, Loader2, X } from "lucide-react";
import { useUser } from "../../components/AuthProvider";
import { supabaseAdmin } from "../../lib/supabase";
import { addFriendViaInvite, checkFriendship } from "../../api/friends";

// Server function to get user by ID (public, no auth required)
// Uses admin client to bypass RLS since this is a public invite page
const getInviterById = createServerFn({ method: "GET" })
	.inputValidator((data: { userId: string }) => data)
	.handler(async ({ data: { userId } }) => {
		const { data, error } = await supabaseAdmin
			.from("users")
			.select("id, username, display_name, avatar_url, total_bets, bets_won")
			.eq("id", userId)
			.single();

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data };
	});

export const Route = createFileRoute("/invite/$userId")({
	component: InvitePage,
	loader: async ({ params }) => {
		const result = await getInviterById({ data: { userId: params.userId } });
		return { inviter: result.data, error: result.error };
	},
});

function InvitePage() {
	const { userId } = Route.useParams();
	const { inviter: loaderInviter, error: loaderError } = Route.useLoaderData();
	const { user, isLoaded, isSignedIn } = useUser();
	const navigate = useNavigate();

	const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
	const [addingFriend, setAddingFriend] = useState(false);
	const [friendAdded, setFriendAdded] = useState(false);
	const [error, setError] = useState<string | null>(loaderError);

	// Check friendship status and auto-add friend when authenticated
	useEffect(() => {
		async function checkAndAutoAdd() {
			if (!isLoaded || !isSignedIn || !user || !loaderInviter) return;

			// Don't add yourself as a friend
			if (user.id === loaderInviter.id) {
				setFriendshipStatus("self");
				return;
			}

			const result = await checkFriendship({ data: { userId: loaderInviter.id } });
			if (!result.error && result.status === "accepted") {
				setFriendshipStatus("accepted");
			} else if (!result.status || result.status === "none" || result.status === "pending") {
				// Auto-add friend via invite link
				setAddingFriend(true);
				const addResult = await addFriendViaInvite({
					data: { friendId: loaderInviter.id },
				});

				if (addResult.error) {
					setError(addResult.error);
				} else {
					setFriendAdded(true);
					setFriendshipStatus("accepted");
				}
				setAddingFriend(false);
			}
		}

		checkAndAutoAdd();
	}, [isLoaded, isSignedIn, user, loaderInviter]);

	const handleAddFriend = async () => {
		if (!loaderInviter) return;

		setAddingFriend(true);
		const result = await addFriendViaInvite({
			data: { friendId: loaderInviter.id },
		});

		if (result.error) {
			setError(result.error);
		} else {
			setFriendAdded(true);
			setFriendshipStatus("accepted");
		}
		setAddingFriend(false);
	};

	const handleSignUpToAdd = () => {
		const redirectUrl = `/invite/${userId}`;
		navigate({
			to: "/auth/signup",
			search: { redirect_url: redirectUrl },
		});
	};

	// Loading state
	if (!isLoaded) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
				<div className="text-center">
					<Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
					<p className="mt-2 text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	// User not found
	if (loaderError || !loaderInviter) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
				<div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
					<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<Users className="w-8 h-8 text-gray-400" />
					</div>
					<h1 className="text-2xl font-bold text-gray-800 mb-2">
						User Not Found
					</h1>
					<p className="text-gray-500 mb-6">
						This invite link is invalid or the user no longer exists.
					</p>
					<Link to="/" className="ibetu-btn-primary inline-block">
						Go to Home
					</Link>
				</div>
			</div>
		);
	}

	const inviter = loaderInviter;

	// Render invite page with user info
	return (
		<div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
			<div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
				{/* Inviter Avatar */}
				<div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
					{inviter.avatar_url ? (
						<img
							src={inviter.avatar_url}
							alt={inviter.display_name}
							className="w-full h-full object-cover"
						/>
					) : (
						<span className="text-3xl font-bold text-white">
							{inviter.display_name.charAt(0).toUpperCase()}
						</span>
					)}
				</div>

				{/* Inviter Info */}
				<h1 className="text-2xl font-bold text-gray-800 mb-1">
					{inviter.display_name}
				</h1>
				{inviter.username && (
					<p className="text-gray-500 mb-2">@{inviter.username}</p>
				)}

				{/* Stats */}
				<div className="flex justify-center gap-6 mb-6 text-sm">
					<div>
						<span className="font-bold text-gray-800">{inviter.total_bets}</span>
						<span className="text-gray-500 ml-1">bets</span>
					</div>
					<div>
						<span className="font-bold text-gray-800">{inviter.bets_won}</span>
						<span className="text-gray-500 ml-1">wins</span>
					</div>
				</div>

				<p className="text-gray-600 mb-6">
					{inviter.display_name} wants to add you as a friend on IBetU!
				</p>

				{/* Action buttons based on auth state */}
				{isSignedIn ? (
					// Authenticated user
					<div>
						{friendshipStatus === "self" ? (
							<div className="flex items-center justify-center gap-2 text-gray-500 mb-4">
								<span className="font-medium">This is your own invite link</span>
							</div>
						) : friendshipStatus === "accepted" || friendAdded ? (
							<div className="flex items-center justify-center gap-2 text-green-600 mb-4">
								<Check className="w-5 h-5" />
								<span className="font-medium">You're now friends!</span>
							</div>
						) : addingFriend ? (
							<div className="flex items-center justify-center gap-2 text-orange-500 mb-4">
								<Loader2 className="w-5 h-5 animate-spin" />
								<span className="font-medium">Adding friend...</span>
							</div>
						) : (
							<button
								onClick={handleAddFriend}
								disabled={addingFriend}
								className="ibetu-btn-primary w-full flex items-center justify-center gap-2 mb-4"
							>
								<UserPlus className="w-5 h-5" />
								Add Friend
							</button>
						)}

						{error && (
							<div className="flex items-center justify-center gap-2 text-red-500 mb-4">
								<X className="w-5 h-5" />
								<span>{error}</span>
							</div>
						)}

						<Link
							to="/dashboard"
							className="text-gray-500 hover:text-gray-700 text-sm"
						>
							Go to Dashboard
						</Link>
					</div>
				) : (
					// Unauthenticated user - show signup CTA
					<div>
						<button
							onClick={handleSignUpToAdd}
							className="ibetu-btn-primary w-full flex items-center justify-center gap-2 mb-4"
						>
							<UserPlus className="w-5 h-5" />
							Sign Up to Add Friend
						</button>
						<p className="text-gray-500 text-sm mb-4">
							Create an account to connect with {inviter.display_name} and start
							betting!
						</p>
						<Link
							to="/auth/login"
							search={{ redirect_url: `/invite/${userId}` }}
							className="text-orange-500 hover:text-orange-600 text-sm font-medium"
						>
							Already have an account? Log in
						</Link>
					</div>
				)}
			</div>
		</div>
	);
}
