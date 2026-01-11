import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useUser } from "@clerk/tanstack-react-start";
import {
	UserPlus,
	Search,
	QrCode,
	Phone,
	AtSign,
	Users,
	X,
} from "lucide-react";
import { QRCodeDisplay } from "../components/QRCode";
import { generateFriendInviteLink, getFriendInviteShareData } from "../lib/sharing";

export const Route = createFileRoute("/friends")({ component: FriendsPage });

type AddMethod = "qr" | "phone" | "nickname";

function FriendsPage() {
	const { user } = useUser();
	const [searchQuery, setSearchQuery] = useState("");
	const [showAddModal, setShowAddModal] = useState(false);
	const [addMethod, setAddMethod] = useState<AddMethod>("nickname");
	const [addInput, setAddInput] = useState("");
	const [showQR, setShowQR] = useState(false);

	const username = user?.username || "user";
	const displayName = user?.firstName
		? `${user.firstName} ${user.lastName || ""}`.trim()
		: "User";

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header */}
			<div className="bg-white shadow">
				<div className="max-w-4xl mx-auto px-6 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-800">Friends</h1>
							<p className="text-gray-500">0 friends</p>
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
								type="button"
								onClick={() => {
									setAddMethod("nickname");
									setAddInput("");
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
								type="button"
								onClick={() => {
									setAddMethod("phone");
									setAddInput("");
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
								type="button"
								onClick={() => {
									setAddMethod("qr");
									setAddInput("");
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
							<div className="py-4">
								<QRCodeDisplay
									value={generateFriendInviteLink(username)}
									title={`Add @${username}`}
									description="Scan this QR code or share the link to add me as a friend on IBetU"
									shareData={getFriendInviteShareData(username, displayName)}
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
										placeholder={
											addMethod === "phone"
												? "Enter phone number"
												: "Enter username or name"
										}
										className="ibetu-input pr-20"
									/>
									<button
										type="button"
										className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
									>
										Search
									</button>
								</div>

								<p className="text-center text-gray-400 py-4">
									{addMethod === "phone"
										? "Enter a phone number to find friends"
										: "Search by username or display name"}
								</p>
							</>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
