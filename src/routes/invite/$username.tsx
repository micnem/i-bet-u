import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus, ArrowLeft, Trophy, Users, Check } from "lucide-react";
import { mockUsers, mockFriends, currentUser } from "../../data/mockData";

export const Route = createFileRoute("/invite/$username")({
	component: InvitePage,
});

function InvitePage() {
	const { username } = Route.useParams();
	const navigate = useNavigate();
	const [requestSent, setRequestSent] = useState(false);

	// Find the user by username
	const inviter = mockUsers.find((u) => u.username === username);

	// Check if already friends
	const isAlreadyFriend = mockFriends.some(
		(f) => f.user.username === username
	);

	// Check if it's the current user
	const isSelf = currentUser.username === username;

	const handleAddFriend = () => {
		// Mock add friend - in real app would call API
		setRequestSent(true);
	};

	if (!inviter) {
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

	return (
		<div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center p-6">
			<div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
				<Link
					to="/"
					className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
				>
					<ArrowLeft size={20} />
					Back
				</Link>

				<div className="text-center">
					<img
						src={inviter.avatar}
						alt={inviter.displayName}
						className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-orange-100"
					/>

					<h1 className="text-2xl font-bold text-gray-800 mb-1">
						{inviter.displayName}
					</h1>
					<p className="text-gray-500 mb-4">@{inviter.username}</p>

					{/* Stats */}
					<div className="flex justify-center gap-6 mb-6">
						<div className="text-center">
							<p className="text-2xl font-bold text-gray-800">
								{inviter.stats.totalBets}
							</p>
							<p className="text-xs text-gray-500">Bets</p>
						</div>
						<div className="text-center">
							<p className="text-2xl font-bold text-green-500">
								{inviter.stats.winRate}%
							</p>
							<p className="text-xs text-gray-500">Win Rate</p>
						</div>
						<div className="text-center">
							<p className="text-2xl font-bold text-orange-500">
								{inviter.stats.won}
							</p>
							<p className="text-xs text-gray-500">Wins</p>
						</div>
					</div>

					<p className="text-gray-600 mb-6">
						{isSelf
							? "This is your own invite link!"
							: isAlreadyFriend
								? `You're already friends with ${inviter.displayName}!`
								: `${inviter.displayName} wants to be your friend on IBetU`}
					</p>

					{isSelf ? (
						<Link to="/friends" className="ibetu-btn-primary w-full block">
							Go to Friends
						</Link>
					) : isAlreadyFriend ? (
						<Link
							to="/bets/create"
							search={{ friendId: inviter.id }}
							className="ibetu-btn-primary w-full block"
						>
							<Trophy className="inline w-5 h-5 mr-2" />
							Challenge to a Bet
						</Link>
					) : requestSent ? (
						<div className="bg-green-50 border border-green-200 rounded-lg p-4">
							<Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
							<p className="text-green-700 font-medium">Friend Request Sent!</p>
							<p className="text-green-600 text-sm">
								{inviter.displayName} will be notified
							</p>
						</div>
					) : (
						<button
							onClick={handleAddFriend}
							className="ibetu-btn-primary w-full flex items-center justify-center gap-2"
						>
							<UserPlus size={20} />
							Add Friend
						</button>
					)}

					{!isSelf && !isAlreadyFriend && !requestSent && (
						<p className="text-xs text-gray-400 mt-4">
							You'll be able to bet with each other once they accept
						</p>
					)}
				</div>

				{/* App promotion */}
				<div className="mt-8 pt-6 border-t border-gray-200 text-center">
					<p className="text-sm text-gray-500 mb-3">Don't have an account?</p>
					<Link
						to="/auth/signup"
						className="ibetu-btn-outline w-full block text-center"
					>
						Sign Up for IBetU
					</Link>
				</div>
			</div>
		</div>
	);
}
