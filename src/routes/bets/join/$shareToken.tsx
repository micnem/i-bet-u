import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DollarSign, Calendar, Shield, Check, Loader2, X, Trophy } from "lucide-react";
import { useUser } from "../../../components/AuthProvider";
import { getBetByShareToken, acceptBetViaShareLink } from "../../../api/bets";

export const Route = createFileRoute("/bets/join/$shareToken")({
	component: JoinBetPage,
	loader: async ({ params }) => {
		const result = await getBetByShareToken({ data: { shareToken: params.shareToken } });
		return { bet: result.data, error: result.error };
	},
});

function JoinBetPage() {
	const { shareToken } = Route.useParams();
	const { bet: loaderBet, error: loaderError } = Route.useLoaderData();
	const { user, isLoaded, isSignedIn } = useUser();
	const navigate = useNavigate();

	const [accepting, setAccepting] = useState(false);
	const [accepted, setAccepted] = useState(false);
	const [error, setError] = useState<string | null>(loaderError);
	const [acceptedBetId, setAcceptedBetId] = useState<string | null>(null);

	const handleAcceptBet = async () => {
		if (!loaderBet) return;

		setAccepting(true);
		setError(null);

		const result = await acceptBetViaShareLink({ data: { shareToken } });

		if (result.error) {
			setError(result.error);
			setAccepting(false);
		} else {
			setAccepted(true);
			setAcceptedBetId(result.data?.id || null);
			setAccepting(false);
		}
	};

	const handleSignUpToAccept = () => {
		const redirectUrl = `/bets/join/${shareToken}`;
		navigate({
			to: "/auth/signup",
			search: { redirect_url: redirectUrl },
		});
	};

	// Format the deadline for display
	const formatDeadline = (deadline: string) => {
		const date = new Date(deadline);
		return date.toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	};

	// Format verification method for display
	const formatVerificationMethod = (method: string) => {
		const methods: Record<string, string> = {
			mutual_agreement: "Mutual Agreement",
			photo_proof: "Photo Proof",
			third_party: "Third Party",
			honor_system: "Honor System",
		};
		return methods[method] || method;
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

	// Bet not found or no longer available
	if (loaderError || !loaderBet) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
				<div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
					<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<Trophy className="w-8 h-8 text-gray-400" />
					</div>
					<h1 className="text-2xl font-bold text-gray-800 mb-2">
						Bet Not Available
					</h1>
					<p className="text-gray-500 mb-6">
						{loaderError || "This bet link is invalid or the bet has already been accepted."}
					</p>
					<Link to="/" className="ibetu-btn-primary inline-block">
						Go to Home
					</Link>
				</div>
			</div>
		);
	}

	const bet = loaderBet;
	const creator = bet.creator;
	const isOwnBet = isSignedIn && user?.id === creator.id;

	// Render bet invite page
	return (
		<div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
			<div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
				{/* Creator Avatar & Challenge Header */}
				<div className="text-center mb-6">
					<div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
						{creator.avatar_url ? (
							<img
								src={creator.avatar_url}
								alt={creator.display_name}
								className="w-full h-full object-cover"
							/>
						) : (
							<span className="text-2xl font-bold text-white">
								{creator.display_name.charAt(0).toUpperCase()}
							</span>
						)}
					</div>
					<p className="text-gray-500 text-sm mb-1">
						{creator.display_name} challenges you!
					</p>
					<h1 className="text-2xl font-bold text-gray-800">
						{bet.title}
					</h1>
				</div>

				{/* Bet Details Card */}
				<div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
					{/* Description */}
					{bet.description && (
						<p className="text-gray-600 text-sm pb-3 border-b border-gray-200">
							{bet.description}
						</p>
					)}

					{/* Amount */}
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
							<DollarSign className="w-5 h-5 text-green-600" />
						</div>
						<div>
							<p className="text-xs text-gray-500">Amount</p>
							<p className="font-bold text-lg text-gray-800">${Number(bet.amount).toFixed(2)}</p>
						</div>
					</div>

					{/* Deadline */}
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
							<Calendar className="w-5 h-5 text-blue-600" />
						</div>
						<div>
							<p className="text-xs text-gray-500">Deadline</p>
							<p className="font-medium text-gray-800">{formatDeadline(bet.deadline)}</p>
						</div>
					</div>

					{/* Verification Method */}
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
							<Shield className="w-5 h-5 text-purple-600" />
						</div>
						<div>
							<p className="text-xs text-gray-500">Verification</p>
							<p className="font-medium text-gray-800">{formatVerificationMethod(bet.verification_method)}</p>
						</div>
					</div>
				</div>

				{/* Action Section */}
				{accepted ? (
					// Successfully accepted
					<div className="text-center">
						<div className="flex items-center justify-center gap-2 text-green-600 mb-4">
							<Check className="w-6 h-6" />
							<span className="font-semibold text-lg">Bet Accepted!</span>
						</div>
						<p className="text-gray-500 text-sm mb-4">
							You're now betting against {creator.display_name}. Good luck!
						</p>
						<Link
							to="/bets/$betId"
							params={{ betId: acceptedBetId || bet.id }}
							className="ibetu-btn-primary w-full inline-flex items-center justify-center"
						>
							View Bet Details
						</Link>
					</div>
				) : isOwnBet ? (
					// User is the creator
					<div className="text-center">
						<p className="text-gray-500 mb-4">
							This is your own bet. Share this link with someone to challenge them!
						</p>
						<Link to="/dashboard" className="ibetu-btn-secondary w-full inline-block">
							Back to Dashboard
						</Link>
					</div>
				) : isSignedIn ? (
					// Authenticated user - can accept
					<div>
						{error && (
							<div className="flex items-center gap-2 text-red-500 mb-4 p-3 bg-red-50 rounded-lg">
								<X className="w-5 h-5 flex-shrink-0" />
								<span className="text-sm">{error}</span>
							</div>
						)}
						<button
							onClick={handleAcceptBet}
							disabled={accepting}
							className="ibetu-btn-primary w-full flex items-center justify-center gap-2"
						>
							{accepting ? (
								<>
									<Loader2 className="w-5 h-5 animate-spin" />
									Accepting Bet...
								</>
							) : (
								<>
									<Trophy className="w-5 h-5" />
									Accept Challenge
								</>
							)}
						</button>
						<p className="text-gray-400 text-xs text-center mt-3">
							By accepting, you'll be added as {creator.display_name}'s friend if you aren't already.
						</p>
					</div>
				) : (
					// Unauthenticated user - show signup CTA
					<div>
						<button
							onClick={handleSignUpToAccept}
							className="ibetu-btn-primary w-full flex items-center justify-center gap-2 mb-4"
						>
							<Trophy className="w-5 h-5" />
							Sign Up to Accept
						</button>
						<p className="text-gray-500 text-sm text-center mb-4">
							Create an account to accept this bet from {creator.display_name}!
						</p>
						<div className="text-center">
							<Link
								to="/auth/login"
								search={{ redirect_url: `/bets/join/${shareToken}` }}
								className="text-orange-500 hover:text-orange-600 text-sm font-medium"
							>
								Already have an account? Log in
							</Link>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
