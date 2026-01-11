import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useUser } from "@clerk/tanstack-react-start";
import { useState, useEffect } from "react";
import { Users, UserPlus, Check, Clock, Loader2, X } from "lucide-react";
import { getUserByUsername } from "../../api/users";
import { sendFriendRequest, checkFriendship } from "../../api/friends";
import type { User } from "../../lib/database.types";

export const Route = createFileRoute("/invite/$username")({
	component: InvitePage,
});

function InvitePage() {
	const { username } = Route.useParams();
	const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
	const navigate = useNavigate();

	const [inviter, setInviter] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
	const [sendingRequest, setSendingRequest] = useState(false);
	const [requestSent, setRequestSent] = useState(false);

	// Fetch the inviting user
	useEffect(() => {
		async function fetchInviter() {
			setLoading(true);
			setError(null);

			const result = await getUserByUsername({ data: { username } });

			if (result.error || !result.data) {
				setError("User not found");
				setLoading(false);
				return;
			}

			setInviter(result.data);
			setLoading(false);
		}

		fetchInviter();
	}, [username]);

	// Check friendship status when authenticated
	useEffect(() => {
		async function checkStatus() {
			if (!clerkLoaded || !clerkUser || !inviter) return;

			const result = await checkFriendship({ data: { userId: inviter.id } });
			if (!result.error) {
				setFriendshipStatus(result.status);
			}
		}

		checkStatus();
	}, [clerkLoaded, clerkUser, inviter]);

	const handleAddFriend = async () => {
		if (!inviter) return;

		setSendingRequest(true);
		const result = await sendFriendRequest({
			data: { friendId: inviter.id, addedVia: "qr" },
		});

		if (result.error) {
			setError(result.error);
		} else {
			setRequestSent(true);
			setFriendshipStatus("pending");
		}
		setSendingRequest(false);
	};

	const handleSignUpToAdd = () => {
		// Store the invite username and redirect to signup
		const redirectUrl = `/invite/${username}`;
		navigate({
			to: "/auth/signup",
			search: { redirect_url: redirectUrl },
		});
	};

	// Loading state
	if (loading || !clerkLoaded) {
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
	if (error === "User not found" || !inviter) {
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
						The user @{username} doesn't exist or the invite link is invalid.
					</p>
					<Link to="/" className="ibetu-btn-primary inline-block">
						Go to Home
					</Link>
				</div>
			</div>
		);
	}

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
				<p className="text-gray-500 mb-2">@{inviter.username}</p>

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
				{clerkUser ? (
					// Authenticated user
					<div>
						{friendshipStatus === "accepted" ? (
							<div className="flex items-center justify-center gap-2 text-green-600 mb-4">
								<Check className="w-5 h-5" />
								<span className="font-medium">Already friends</span>
							</div>
						) : friendshipStatus === "pending" || requestSent ? (
							<div className="flex items-center justify-center gap-2 text-orange-500 mb-4">
								<Clock className="w-5 h-5" />
								<span className="font-medium">Friend request pending</span>
							</div>
						) : (
							<button
								onClick={handleAddFriend}
								disabled={sendingRequest}
								className="ibetu-btn-primary w-full flex items-center justify-center gap-2 mb-4"
							>
								{sendingRequest ? (
									<Loader2 className="w-5 h-5 animate-spin" />
								) : (
									<UserPlus className="w-5 h-5" />
								)}
								{sendingRequest ? "Sending..." : "Add Friend"}
							</button>
						)}

						{error && error !== "User not found" && (
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
							search={{ redirect_url: `/invite/${username}` }}
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
