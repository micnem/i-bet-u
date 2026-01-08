import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
	UserPlus,
	Search,
	QrCode,
	Phone,
	AtSign,
	Users,
	Trophy,
	Plus,
	X,
	Check,
	Copy,
} from "lucide-react";
import { currentUser, mockFriends, mockUsers } from "../data/mockData";
import type { User } from "../data/types";

export const Route = createFileRoute("/friends")({ component: FriendsPage });

type AddMethod = "qr" | "phone" | "nickname";

function FriendsPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [showAddModal, setShowAddModal] = useState(false);
	const [addMethod, setAddMethod] = useState<AddMethod>("nickname");
	const [addInput, setAddInput] = useState("");
	const [searchResults, setSearchResults] = useState<User[]>([]);
	const [showQR, setShowQR] = useState(false);

	const filteredFriends = mockFriends.filter(
		(friend) =>
			friend.user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			friend.user.username.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const handleSearch = () => {
		if (addMethod === "nickname" && addInput.trim()) {
			// Mock search - find users not already friends
			const results = mockUsers.filter(
				(u) =>
					(u.username.toLowerCase().includes(addInput.toLowerCase()) ||
						u.displayName.toLowerCase().includes(addInput.toLowerCase())) &&
					!mockFriends.some((f) => f.user.id === u.id)
			);
			setSearchResults(results);
		} else if (addMethod === "phone" && addInput.trim()) {
			// Mock phone search
			const results = mockUsers.filter(
				(u) =>
					u.phoneNumber?.includes(addInput) &&
					!mockFriends.some((f) => f.user.id === u.id)
			);
			setSearchResults(results);
		}
	};

	const handleAddFriend = (user: User) => {
		// Mock add friend - in real app would call API
		setShowAddModal(false);
		setAddInput("");
		setSearchResults([]);
	};

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header */}
			<div className="bg-white shadow">
				<div className="max-w-4xl mx-auto px-6 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-800">Friends</h1>
							<p className="text-gray-500">
								{mockFriends.length} friends
							</p>
						</div>
						<button
							onClick={() => setShowAddModal(true)}
							className="ibetu-btn-primary inline-flex items-center gap-2"
						>
							<UserPlus size={20} />
							Add Friend
						</button>
					</div>

					{/* Search */}
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
							className="ibetu-input pl-10"
						/>
					</div>
				</div>
			</div>

			{/* Friends List */}
			<div className="max-w-4xl mx-auto px-6 py-8">
				{filteredFriends.length > 0 ? (
					<div className="grid gap-4">
						{filteredFriends.map((friend) => (
							<div
								key={friend.id}
								className="bg-white rounded-xl shadow-md p-6"
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										<img
											src={friend.user.avatar}
											alt={friend.user.displayName}
											className="w-14 h-14 rounded-full bg-gray-200"
										/>
										<div>
											<h3 className="font-semibold text-gray-800">
												{friend.user.displayName}
											</h3>
											<p className="text-sm text-gray-500">
												@{friend.user.username}
											</p>
											<div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
												<span className="flex items-center gap-1">
													<Trophy size={12} />
													{friend.user.stats.winRate}% win rate
												</span>
												<span>
													Added via {friend.addedVia}
												</span>
											</div>
										</div>
									</div>

									<div className="flex items-center gap-2">
										<Link
											to="/bets/create"
											search={{ friendId: friend.user.id }}
											className="ibetu-btn-primary py-2 text-sm flex items-center gap-1"
										>
											<Plus size={16} />
											Bet
										</Link>
									</div>
								</div>

								{/* Stats */}
								<div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
									<div className="text-center">
										<p className="text-lg font-bold text-gray-800">
											{friend.user.stats.totalBets}
										</p>
										<p className="text-xs text-gray-500">Total Bets</p>
									</div>
									<div className="text-center">
										<p className="text-lg font-bold text-green-500">
											{friend.user.stats.won}
										</p>
										<p className="text-xs text-gray-500">Won</p>
									</div>
									<div className="text-center">
										<p className="text-lg font-bold text-red-500">
											{friend.user.stats.lost}
										</p>
										<p className="text-xs text-gray-500">Lost</p>
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="bg-white rounded-xl shadow-md p-12 text-center">
						<Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
						<h3 className="text-lg font-medium text-gray-800 mb-2">
							{searchQuery ? "No friends found" : "No friends yet"}
						</h3>
						<p className="text-gray-500 mb-4">
							{searchQuery
								? "Try a different search term"
								: "Add friends to start betting!"}
						</p>
						<button
							onClick={() => setShowAddModal(true)}
							className="ibetu-btn-primary inline-flex items-center gap-2"
						>
							<UserPlus size={20} />
							Add Your First Friend
						</button>
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
								onClick={() => {
									setShowAddModal(false);
									setAddInput("");
									setSearchResults([]);
									setShowQR(false);
								}}
								className="text-gray-400 hover:text-gray-600"
							>
								<X size={24} />
							</button>
						</div>

						{/* Method Tabs */}
						<div className="flex gap-2 mb-6">
							<button
								onClick={() => {
									setAddMethod("nickname");
									setAddInput("");
									setSearchResults([]);
									setShowQR(false);
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
								onClick={() => {
									setAddMethod("phone");
									setAddInput("");
									setSearchResults([]);
									setShowQR(false);
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
								onClick={() => {
									setAddMethod("qr");
									setAddInput("");
									setSearchResults([]);
									setShowQR(true);
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
							<div className="text-center">
								<div className="bg-gray-100 rounded-xl p-8 mb-4">
									{/* Mock QR Code */}
									<div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center border-2 border-gray-200">
										<div className="grid grid-cols-5 gap-1">
											{Array.from({ length: 25 }).map((_, i) => (
												<div
													key={i}
													className={`w-6 h-6 ${
														Math.random() > 0.5 ? "bg-gray-900" : "bg-white"
													}`}
												/>
											))}
										</div>
									</div>
								</div>
								<p className="text-gray-600 mb-2">
									Scan this code to add <strong>@{currentUser.username}</strong>
								</p>
								<button
									onClick={() => {
										// Mock copy link
										navigator.clipboard.writeText(
											`https://ibetu.app/add/${currentUser.username}`
										);
									}}
									className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 text-sm"
								>
									<Copy size={16} />
									Copy invite link
								</button>
							</div>
						) : (
							<>
								{/* Search Input */}
								<div className="relative mb-4">
									<input
										type={addMethod === "phone" ? "tel" : "text"}
										value={addInput}
										onChange={(e) => setAddInput(e.target.value)}
										onKeyDown={(e) => e.key === "Enter" && handleSearch()}
										placeholder={
											addMethod === "phone"
												? "Enter phone number"
												: "Enter username or name"
										}
										className="ibetu-input pr-20"
									/>
									<button
										onClick={handleSearch}
										className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
									>
										Search
									</button>
								</div>

								{/* Search Results */}
								{searchResults.length > 0 ? (
									<div className="space-y-3 max-h-64 overflow-y-auto">
										{searchResults.map((user) => (
											<div
												key={user.id}
												className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
											>
												<div className="flex items-center gap-3">
													<img
														src={user.avatar}
														alt={user.displayName}
														className="w-10 h-10 rounded-full bg-gray-200"
													/>
													<div>
														<p className="font-medium text-gray-800">
															{user.displayName}
														</p>
														<p className="text-sm text-gray-500">
															@{user.username}
														</p>
													</div>
												</div>
												<button
													onClick={() => handleAddFriend(user)}
													className="px-3 py-1 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 flex items-center gap-1"
												>
													<Plus size={16} />
													Add
												</button>
											</div>
										))}
									</div>
								) : addInput && searchResults.length === 0 ? (
									<p className="text-center text-gray-500 py-4">
										No users found. Try a different search.
									</p>
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
