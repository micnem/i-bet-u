import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useUser } from "../components/AuthProvider";
import {
	UserPlus,
	Search,
	QrCode,
	Phone,
	AtSign,
	Users,
	X,
	Check,
	Loader2,
	UserX,
} from "lucide-react";
import { QRCodeDisplay } from "../components/QRCode";
import { generateFriendInviteLink, getFriendInviteShareData } from "../lib/sharing";
import {
	getFriends,
	getPendingFriendRequests,
	acceptFriendRequest,
	declineFriendRequest,
	sendFriendRequest,
} from "../api/friends";
import { searchUsers, searchUserByPhone } from "../api/users";
import type { User } from "../lib/database.types";

export const Route = createFileRoute("/friends")({ component: FriendsPage });

type AddMethod = "qr" | "phone" | "nickname";

interface Friend {
	id: string;
	friend: {
		id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
}

interface FriendRequest {
	id: string;
	requester: {
		id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
}

function FriendsPage() {
	const { user, isLoaded, isSignedIn } = useUser();
	const [searchQuery, setSearchQuery] = useState("");
	const [showAddModal, setShowAddModal] = useState(false);
	const [addMethod, setAddMethod] = useState<AddMethod>("nickname");
	const [addInput, setAddInput] = useState("");

	// Data states
	const [friends, setFriends] = useState<Friend[]>([]);
	const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
	const [loading, setLoading] = useState(true);
	const [processingRequest, setProcessingRequest] = useState<string | null>(null);

	// Search states
	const [searchResults, setSearchResults] = useState<User[]>([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);
	const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

	const userId = user?.id || "";
	const displayName = user?.firstName
		? `${user.firstName} ${user.lastName || ""}`.trim()
		: "User";

	// Fetch friends and pending requests
	useEffect(() => {
		async function fetchData() {
			if (!isLoaded || !isSignedIn) return;

			setLoading(true);
			try {
				const [friendsResult, requestsResult] = await Promise.all([
					getFriends(),
					getPendingFriendRequests(),
				]);

				if (!friendsResult.error && friendsResult.data) {
					setFriends(friendsResult.data as Friend[]);
				}
				if (!requestsResult.error && requestsResult.data) {
					setPendingRequests(requestsResult.data as FriendRequest[]);
				}
			} catch (err) {
				console.error("Failed to fetch friends data:", err);
			}
			setLoading(false);
		}

		fetchData();
	}, [isLoaded, isSignedIn]);

	const handleAcceptRequest = async (friendshipId: string) => {
		setProcessingRequest(friendshipId);
		const result = await acceptFriendRequest({ data: { friendshipId } });
		if (!result.error) {
			// Remove from pending and refresh friends
			setPendingRequests((prev) => prev.filter((r) => r.id !== friendshipId));
			const friendsResult = await getFriends();
			if (!friendsResult.error && friendsResult.data) {
				setFriends(friendsResult.data as Friend[]);
			}
		}
		setProcessingRequest(null);
	};

	const handleDeclineRequest = async (friendshipId: string) => {
		setProcessingRequest(friendshipId);
		const result = await declineFriendRequest({ data: { friendshipId } });
		if (!result.error) {
			setPendingRequests((prev) => prev.filter((r) => r.id !== friendshipId));
		}
		setProcessingRequest(null);
	};

	const handleSearch = async () => {
		if (!addInput.trim()) {
			setSearchError("Please enter a search term");
			return;
		}

		setSearchLoading(true);
		setSearchError(null);
		setSearchResults([]);

		try {
			if (addMethod === "phone") {
				const result = await searchUserByPhone({ data: { phoneNumber: addInput.trim() } });
				if (result.error) {
					setSearchError(result.error === "JSON object requested, multiple (or no) rows returned"
						? "No user found with this phone number"
						: result.error);
				} else if (result.data) {
					setSearchResults([result.data]);
				}
			} else {
				const result = await searchUsers({ data: { query: addInput.trim() } });
				if (result.error) {
					setSearchError(result.error);
				} else if (result.data) {
					// Filter out users that are already friends
					const friendIds = new Set(friends.map((f) => f.friend.id));
					const filteredResults = result.data.filter(
						(u: User) => !friendIds.has(u.id)
					);
					setSearchResults(filteredResults);
					if (filteredResults.length === 0) {
						setSearchError("No users found matching your search");
					}
				}
			}
		} catch (err) {
			setSearchError("Failed to search users");
			console.error("Search error:", err);
		}

		setSearchLoading(false);
	};

	const handleSendFriendRequest = async (friendId: string) => {
		setSentRequests((prev) => new Set(prev).add(friendId));

		const result = await sendFriendRequest({
			data: {
				friendId,
				addedVia: addMethod === "phone" ? "phone" : "nickname",
			},
		});

		if (result.error) {
			// Remove from sent requests if failed
			setSentRequests((prev) => {
				const updated = new Set(prev);
				updated.delete(friendId);
				return updated;
			});
			setSearchError(result.error);
		}
	};

	// Filter friends by search query
	const filteredFriends = friends.filter((f) => {
		const friend = f.friend;
		if (!friend) return false;
		const query = searchQuery.toLowerCase();
		return (
			friend.display_name?.toLowerCase().includes(query) ||
			friend.username?.toLowerCase().includes(query)
		);
	});

	if (!isLoaded || loading) {
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
				<div className="max-w-4xl mx-auto px-6 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-800">Friends</h1>
							<p className="text-gray-500">{friends.length} friend{friends.length !== 1 ? "s" : ""}</p>
						</div>
						<button
							type="button"
							onClick={() => setShowAddModal(true)}
							className="ibetu-btn-primary inline-flex items-center gap-2"
						>
							<UserPlus size={20} />
							Add Friend
						</button>
					</div>

					{/* Search */}
					{friends.length > 0 && (
						<div className="relative mt-6">
							<Search
								className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
								size={20}
							/>
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search friends..."
								className="ibetu-input !pl-10"
							/>
						</div>
					)}
				</div>
			</div>

			<div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
				{/* Pending Friend Requests */}
				{pendingRequests.length > 0 && (
					<div className="bg-white rounded-xl shadow-md p-6">
						<h2 className="text-lg font-bold text-gray-800 mb-4">
							Friend Requests ({pendingRequests.length})
						</h2>
						<div className="space-y-3">
							{pendingRequests.map((request) => (
								<div
									key={request.id}
									className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
								>
									<div className="flex items-center gap-3">
										<div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
											{request.requester.avatar_url ? (
												<img
													src={request.requester.avatar_url}
													alt={request.requester.display_name}
													className="w-full h-full object-cover"
												/>
											) : (
												<span className="text-lg font-bold text-white">
													{request.requester.display_name?.charAt(0).toUpperCase() || "?"}
												</span>
											)}
										</div>
										<div>
											<p className="font-medium text-gray-800">
												{request.requester.display_name}
											</p>
											{request.requester.username && (
												<p className="text-sm text-gray-500">
													@{request.requester.username}
												</p>
											)}
										</div>
									</div>
									<div className="flex gap-2">
										<button
											type="button"
											onClick={() => handleAcceptRequest(request.id)}
											disabled={processingRequest === request.id}
											className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
										>
											{processingRequest === request.id ? (
												<Loader2 size={20} className="animate-spin" />
											) : (
												<Check size={20} />
											)}
										</button>
										<button
											type="button"
											onClick={() => handleDeclineRequest(request.id)}
											disabled={processingRequest === request.id}
											className="p-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
										>
											<X size={20} />
										</button>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Friends List */}
				{friends.length === 0 ? (
					<div className="bg-white rounded-xl shadow-md p-12 text-center">
						<Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
						<h3 className="text-lg font-medium text-gray-800 mb-2">
							No friends yet
						</h3>
						<p className="text-gray-500 mb-4">
							Add friends to start betting!
						</p>
						<button
							type="button"
							onClick={() => setShowAddModal(true)}
							className="ibetu-btn-primary inline-flex items-center gap-2"
						>
							<UserPlus size={20} />
							Add Your First Friend
						</button>
					</div>
				) : (
					<div className="bg-white rounded-xl shadow-md p-6">
						<h2 className="text-lg font-bold text-gray-800 mb-4">Your Friends</h2>
						<div className="space-y-3">
							{filteredFriends.map((f) => {
								const friend = f.friend;
								if (!friend) return null;
								return (
									<div
										key={f.id}
										className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
									>
										<div className="flex items-center gap-3">
											<div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
												{friend.avatar_url ? (
													<img
														src={friend.avatar_url}
														alt={friend.display_name}
														className="w-full h-full object-cover"
													/>
												) : (
													<span className="text-lg font-bold text-white">
														{friend.display_name?.charAt(0).toUpperCase() || "?"}
													</span>
												)}
											</div>
											<div>
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
										<Link
											to="/bets/create"
											search={{ friendId: friend.id }}
											className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
										>
											Bet
										</Link>
									</div>
								);
							})}
							{filteredFriends.length === 0 && searchQuery && (
								<p className="text-center text-gray-500 py-4">
									No friends match "{searchQuery}"
								</p>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Add Friend Modal */}
			{showAddModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-xl max-w-md w-full p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-bold text-gray-800">Add Friend</h2>
							<button
								type="button"
								onClick={() => {
									setShowAddModal(false);
									setAddInput("");
									setSearchResults([]);
									setSearchError(null);
									setSentRequests(new Set());
								}}
								className="text-gray-400 hover:text-gray-600"
							>
								<X size={24} />
							</button>
						</div>

						{/* Method Tabs */}
						<div className="flex gap-2 mb-6">
							<button
								type="button"
								onClick={() => {
									setAddMethod("nickname");
									setAddInput("");
									setSearchResults([]);
									setSearchError(null);
								}}
								className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
									addMethod === "nickname"
										? "bg-orange-500 text-white"
										: "bg-gray-100 text-gray-600 hover:bg-gray-200"
								}`}
							>
								<AtSign size={16} />
								Nickname
							</button>
							<button
								type="button"
								onClick={() => {
									setAddMethod("phone");
									setAddInput("");
									setSearchResults([]);
									setSearchError(null);
								}}
								className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
									addMethod === "phone"
										? "bg-orange-500 text-white"
										: "bg-gray-100 text-gray-600 hover:bg-gray-200"
								}`}
							>
								<Phone size={16} />
								Phone
							</button>
							<button
								type="button"
								onClick={() => {
									setAddMethod("qr");
									setAddInput("");
									setSearchResults([]);
									setSearchError(null);
								}}
								className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
									addMethod === "qr"
										? "bg-orange-500 text-white"
										: "bg-gray-100 text-gray-600 hover:bg-gray-200"
								}`}
							>
								<QrCode size={16} />
								QR Code
							</button>
						</div>

						{/* QR Code Display */}
						{addMethod === "qr" ? (
							<div className="py-4">
								<QRCodeDisplay
									value={generateFriendInviteLink(userId)}
									title={`Add ${displayName}`}
									description="Scan this QR code or share the link to add me as a friend on IBetU"
									shareData={getFriendInviteShareData(userId, displayName)}
									size={180}
								/>
							</div>
						) : (
							<>
								{/* Search Input */}
								<div className="relative mb-4">
									<input
										type={addMethod === "phone" ? "tel" : "text"}
										value={addInput}
										onChange={(e) => setAddInput(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter" && !searchLoading) {
												handleSearch();
											}
										}}
										placeholder={
											addMethod === "phone"
												? "Enter phone number"
												: "Enter username or name"
										}
										className="ibetu-input pr-20"
									/>
									<button
										type="button"
										onClick={handleSearch}
										disabled={searchLoading}
										className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
									>
										{searchLoading ? (
											<Loader2 size={16} className="animate-spin" />
										) : (
											"Search"
										)}
									</button>
								</div>

								{/* Search Error */}
								{searchError && (
									<p className="text-center text-red-500 text-sm mb-4">
										{searchError}
									</p>
								)}

								{/* Search Results */}
								{searchResults.length > 0 ? (
									<div className="space-y-3 max-h-64 overflow-y-auto">
										{searchResults.map((user) => (
											<div
												key={user.id}
												className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
											>
												<div className="flex items-center gap-3">
													<div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
														{user.avatar_url ? (
															<img
																src={user.avatar_url}
																alt={user.display_name}
																className="w-full h-full object-cover"
															/>
														) : (
															<span className="text-sm font-bold text-white">
																{user.display_name?.charAt(0).toUpperCase() || "?"}
															</span>
														)}
													</div>
													<div>
														<p className="font-medium text-gray-800 text-sm">
															{user.display_name}
														</p>
														<p className="text-xs text-gray-500">
															@{user.username}
														</p>
													</div>
												</div>
												<button
													type="button"
													onClick={() => handleSendFriendRequest(user.id)}
													disabled={sentRequests.has(user.id)}
													className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
														sentRequests.has(user.id)
															? "bg-green-100 text-green-700"
															: "bg-orange-500 text-white hover:bg-orange-600"
													}`}
												>
													{sentRequests.has(user.id) ? (
														<span className="flex items-center gap-1">
															<Check size={14} />
															Sent
														</span>
													) : (
														<span className="flex items-center gap-1">
															<UserPlus size={14} />
															Add
														</span>
													)}
												</button>
											</div>
										))}
									</div>
								) : (
									<p className="text-center text-gray-400 py-4">
										{addMethod === "phone"
											? "Enter a phone number to find friends"
											: "Search by username or display name"}
									</p>
								)}
							</>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
