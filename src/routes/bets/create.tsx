import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Users, Loader2, Check } from "lucide-react";
import { getFriends } from "../../api/friends";
import { createBet } from "../../api/bets";
import type { VerificationMethod } from "../../lib/database.types";

export const Route = createFileRoute("/bets/create")({
	component: CreateBetPage,
	validateSearch: (search: Record<string, unknown>) => ({
		friendId: search.friendId as string | undefined,
	}),
});

interface Friend {
	id: string;
	friend: {
		id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
}

function CreateBetPage() {
	const { friendId: preselectedFriendId } = Route.useSearch();
	const navigate = useNavigate();

	const [friends, setFriends] = useState<Friend[]>([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Form state
	const [selectedFriendId, setSelectedFriendId] = useState<string | null>(preselectedFriendId || null);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [amount, setAmount] = useState("");
	const [deadline, setDeadline] = useState("");
	const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>("mutual_agreement");

	// Fetch friends
	useEffect(() => {
		async function fetchFriends() {
			setLoading(true);
			const result = await getFriends();
			if (!result.error && result.data) {
				setFriends(result.data as Friend[]);
			}
			setLoading(false);
		}
		fetchFriends();
	}, []);

	const selectedFriend = friends.find((f) => f.friend?.id === selectedFriendId)?.friend;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedFriendId || !title || !amount || !deadline) {
			setError("Please fill in all required fields");
			return;
		}

		setSubmitting(true);
		setError(null);

		const result = await createBet({
			data: {
				title,
				description,
				amount: parseFloat(amount),
				opponentId: selectedFriendId,
				deadline: new Date(deadline).toISOString(),
				verificationMethod,
			},
		});

		if (result.error) {
			setError(result.error);
			setSubmitting(false);
		} else {
			navigate({ to: "/dashboard" });
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<Loader2 className="w-8 h-8 animate-spin text-orange-500" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header */}
			<div className="bg-white shadow">
				<div className="max-w-2xl mx-auto px-6 py-4">
					<Link
						to="/dashboard"
						className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
					>
						<ArrowLeft size={20} />
						Back
					</Link>
					<h1 className="text-2xl font-bold text-gray-800">Create New Bet</h1>
				</div>
			</div>

			<div className="max-w-2xl mx-auto px-6 py-8">
				{friends.length === 0 ? (
					<div className="bg-white rounded-xl shadow-md p-6">
						<div className="text-center py-8 text-gray-500">
							<Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
							<p>No friends yet</p>
							<p className="text-sm mt-2">Add friends first to create bets</p>
							<Link
								to="/friends"
								className="ibetu-btn-primary inline-flex items-center gap-2 mt-4"
							>
								Add Friends
							</Link>
						</div>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Select Opponent */}
						<div className="bg-white rounded-xl shadow-md p-6">
							<div className="flex items-center gap-3 mb-4">
								<div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
									<Users className="w-5 h-5 text-orange-500" />
								</div>
								<div>
									<h2 className="text-lg font-semibold">Select Opponent</h2>
									<p className="text-sm text-gray-500">
										Choose a friend to bet against
									</p>
								</div>
							</div>

							<div className="grid gap-2 max-h-60 overflow-y-auto">
								{friends.map((f) => {
									const friend = f.friend;
									if (!friend) return null;
									const isSelected = selectedFriendId === friend.id;
									return (
										<button
											key={f.id}
											type="button"
											onClick={() => setSelectedFriendId(friend.id)}
											className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
												isSelected
													? "border-orange-500 bg-orange-50"
													: "border-gray-200 hover:border-gray-300"
											}`}
										>
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
													{friend.avatar_url ? (
														<img
															src={friend.avatar_url}
															alt={friend.display_name}
															className="w-full h-full object-cover"
														/>
													) : (
														<span className="text-sm font-bold text-white">
															{friend.display_name?.charAt(0).toUpperCase() || "?"}
														</span>
													)}
												</div>
												<div className="text-left">
													<p className="font-medium text-gray-800">
														{friend.display_name}
													</p>
													{friend.username && (
														<p className="text-sm text-gray-500">
															@{friend.username}
														</p>
													)}
												</div>
											</div>
											{isSelected && (
												<Check className="w-5 h-5 text-orange-500" />
											)}
										</button>
									);
								})}
							</div>
						</div>

						{/* Bet Details */}
						{selectedFriendId && (
							<div className="bg-white rounded-xl shadow-md p-6 space-y-4">
								<h2 className="text-lg font-semibold">Bet Details</h2>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Title *
									</label>
									<input
										type="text"
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										placeholder="e.g., Lakers win tonight"
										className="ibetu-input"
										required
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Description
									</label>
									<textarea
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder="Add more details about the bet..."
										className="ibetu-input min-h-[80px]"
										rows={3}
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Amount ($) *
										</label>
										<input
											type="number"
											value={amount}
											onChange={(e) => setAmount(e.target.value)}
											placeholder="10"
											min="1"
											step="0.01"
											className="ibetu-input"
											required
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Deadline *
										</label>
										<input
											type="datetime-local"
											value={deadline}
											onChange={(e) => setDeadline(e.target.value)}
											className="ibetu-input"
											required
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										How will the winner be decided?
									</label>
									<select
										value={verificationMethod}
										onChange={(e) => setVerificationMethod(e.target.value as VerificationMethod)}
										className="ibetu-input"
									>
										<option value="mutual_agreement">Mutual Agreement</option>
										<option value="photo_proof">Photo Proof</option>
										<option value="witness">Witness</option>
									</select>
								</div>

								{error && (
									<div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
										{error}
									</div>
								)}

								<button
									type="submit"
									disabled={submitting}
									className="ibetu-btn-primary w-full flex items-center justify-center gap-2"
								>
									{submitting ? (
										<>
											<Loader2 className="w-5 h-5 animate-spin" />
											Creating Bet...
										</>
									) : (
										<>
											Send Bet to {selectedFriend?.display_name}
										</>
									)}
								</button>
							</div>
						)}
					</form>
				)}
			</div>
		</div>
	);
}
