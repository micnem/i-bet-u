import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useUser, useAuth } from "./AuthProvider";
import {
	Bell,
	CheckCircle,
	Home,
	LogIn,
	LogOut,
	Medal,
	Menu,
	Plus,
	Trophy,
	User,
	UserPlus,
	Users,
	X,
	XCircle,
	Loader2,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import {
	getNotifications,
	getNotificationCounts,
	type Notification,
	type NotificationCounts,
} from "../api/notifications";
import { acceptFriendRequest, declineFriendRequest } from "../api/friends";
import { acceptBet, declineBet } from "../api/bets";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [notificationCounts, setNotificationCounts] =
		useState<NotificationCounts>({
			friendRequests: 0,
			betInvitations: 0,
			betResolutions: 0,
			total: 0,
		});
	const [notificationsLoading, setNotificationsLoading] = useState(false);
	const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const notificationRef = useRef<HTMLDivElement>(null);

	const location = useLocation();
	const navigate = useNavigate();
	const { user, isSignedIn } = useUser();
	const { signOut } = useAuth();

	// Fetch notification counts
	const fetchNotificationCounts = useCallback(async () => {
		if (!isSignedIn) return;
		const result = await getNotificationCounts();
		if (result.data) {
			setNotificationCounts(result.data);
		}
	}, [isSignedIn]);

	// Fetch full notifications
	const fetchNotifications = useCallback(async () => {
		if (!isSignedIn) return;
		setNotificationsLoading(true);
		const result = await getNotifications();
		if (result.data) {
			setNotifications(result.data);
		}
		setNotificationsLoading(false);
	}, [isSignedIn]);

	// Fetch counts on mount and periodically
	useEffect(() => {
		if (isSignedIn) {
			fetchNotificationCounts();
			// Refresh counts every 30 seconds
			const interval = setInterval(fetchNotificationCounts, 30000);
			return () => clearInterval(interval);
		}
	}, [isSignedIn, fetchNotificationCounts]);

	// Fetch full notifications when dropdown opens
	useEffect(() => {
		if (isNotificationsOpen) {
			fetchNotifications();
		}
	}, [isNotificationsOpen, fetchNotifications]);

	// Close dropdowns when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsDropdownOpen(false);
			}
			if (
				notificationRef.current &&
				!notificationRef.current.contains(event.target as Node)
			) {
				setIsNotificationsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Check if user is on auth pages or landing page
	const isAuthPage = location.pathname.startsWith("/auth");
	const isLandingPage = location.pathname === "/";
	const isPublicPage = isAuthPage || isLandingPage || !isSignedIn;

	// Navigation items for authenticated users
	const authNavItems = [
		{ to: "/dashboard", label: "Dashboard", icon: Home },
		{ to: "/bets", label: "My Bets", icon: Trophy },
		{ to: "/leaderboard", label: "Leaderboard", icon: Medal },
		{ to: "/friends", label: "Friends", icon: Users },
		{ to: "/profile", label: "Profile", icon: User },
	];

	// Navigation items for public pages
	const publicNavItems = [
		{ to: "/", label: "Home", icon: Home },
		{ to: "/auth/login", label: "Sign In", icon: LogIn },
	];

	const navItems = isPublicPage ? publicNavItems : authNavItems;

	const displayName = user?.firstName
		? `${user.firstName} ${user.lastName || ""}`.trim()
		: "User";
	const username = user?.username || "user";
	const avatarUrl =
		user?.imageUrl ||
		`https://api.dicebear.com/7.x/avataaars/svg?seed=${username || "user"}`;

	const handleSignOut = async () => {
		await signOut();
		setIsOpen(false);
		navigate({ to: "/" });
	};

	// Handle friend request actions
	const handleAcceptFriend = async (
		e: React.MouseEvent,
		friendshipId: string
	) => {
		e.preventDefault();
		e.stopPropagation();
		setActionLoadingId(`friend_${friendshipId}`);
		const result = await acceptFriendRequest({ data: { friendshipId } });
		if (!result.error) {
			await fetchNotifications();
			await fetchNotificationCounts();
		}
		setActionLoadingId(null);
	};

	const handleDeclineFriend = async (
		e: React.MouseEvent,
		friendshipId: string
	) => {
		e.preventDefault();
		e.stopPropagation();
		setActionLoadingId(`friend_${friendshipId}`);
		const result = await declineFriendRequest({ data: { friendshipId } });
		if (!result.error) {
			await fetchNotifications();
			await fetchNotificationCounts();
		}
		setActionLoadingId(null);
	};

	// Handle bet actions
	const handleAcceptBet = async (e: React.MouseEvent, betId: string) => {
		e.preventDefault();
		e.stopPropagation();
		setActionLoadingId(`bet_invite_${betId}`);
		const result = await acceptBet({ data: { betId } });
		if (!result.error) {
			await fetchNotifications();
			await fetchNotificationCounts();
		}
		setActionLoadingId(null);
	};

	const handleDeclineBet = async (e: React.MouseEvent, betId: string) => {
		e.preventDefault();
		e.stopPropagation();
		setActionLoadingId(`bet_invite_${betId}`);
		const result = await declineBet({ data: { betId } });
		if (!result.error) {
			await fetchNotifications();
			await fetchNotificationCounts();
		}
		setActionLoadingId(null);
	};

	// Format relative time
	const formatRelativeTime = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return "just now";
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString();
	};

	// Get notification icon based on type
	const getNotificationIcon = (type: Notification["type"]) => {
		switch (type) {
			case "friend_request":
				return <UserPlus size={16} className="text-blue-500" />;
			case "bet_invitation":
				return <Trophy size={16} className="text-orange-500" />;
			case "bet_resolution":
				return <CheckCircle size={16} className="text-green-500" />;
			default:
				return <Bell size={16} className="text-gray-500" />;
		}
	};

	return (
		<>
			<header className="bg-gray-800 text-white shadow-lg sticky top-0 z-40">
				<div className="max-w-6xl mx-auto px-4">
					<div className="flex items-center justify-between h-16">
						{/* Logo */}
						<Link
							to={isPublicPage ? "/" : "/dashboard"}
							className="flex items-center gap-2"
						>
							<span className="text-2xl font-bold text-orange-500">IBetU</span>
						</Link>

						{/* Desktop Navigation */}
						<nav className="hidden md:flex items-center gap-1">
							{navItems.map((item) => {
								const Icon = item.icon;
								const isActive = location.pathname === item.to;
								return (
									<Link
										key={item.to}
										to={item.to}
										className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
											isActive
												? "bg-orange-500 text-white"
												: "text-gray-300 hover:bg-gray-700 hover:text-white"
										}`}
									>
										<Icon size={18} />
										{item.label}
									</Link>
								);
							})}

							{/* Create Bet Button (only for authenticated) */}
							{!isPublicPage && (
								<Link
									to="/bets/create"
									search={{ friendId: undefined }}
									className="ml-2 flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg font-medium transition-colors"
								>
									<Plus size={18} />
									New Bet
								</Link>
							)}

							{/* Sign Up Button (only for public) */}
							{isPublicPage && !isAuthPage && (
								<Link
									to="/auth/signup"
									className="ml-2 flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg font-medium transition-colors"
								>
									Get Started
								</Link>
							)}
						</nav>

						{/* Mobile Menu Button */}
						<div className="flex items-center gap-3 md:hidden">
							{/* Mobile Notification Bell */}
							{!isPublicPage && (
								<div className="relative" ref={notificationRef}>
									<button
										onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
										className="p-2 hover:bg-gray-700 rounded-lg transition-colors relative"
										aria-label="Notifications"
									>
										<Bell size={24} />
										{notificationCounts.total > 0 && (
											<span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center px-1">
												{notificationCounts.total > 99
													? "99+"
													: notificationCounts.total}
											</span>
										)}
									</button>
								</div>
							)}
							<button
								onClick={() => setIsOpen(true)}
								className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
								aria-label="Open menu"
							>
								<Menu size={24} />
							</button>
						</div>

						{/* Desktop Right Section */}
						{!isPublicPage && (
							<div className="hidden md:flex items-center gap-3">
								{/* Notification Bell */}
								<div className="relative" ref={notificationRef}>
									<button
										onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
										className="p-2 hover:bg-gray-700 rounded-lg transition-colors relative"
										aria-label="Notifications"
									>
										<Bell size={22} />
										{notificationCounts.total > 0 && (
											<span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center px-1">
												{notificationCounts.total > 99
													? "99+"
													: notificationCounts.total}
											</span>
										)}
									</button>

									{/* Notifications Dropdown */}
									{isNotificationsOpen && (
										<div className="absolute right-0 top-full mt-2 w-96 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50 max-h-[70vh] overflow-hidden flex flex-col">
											{/* Header */}
											<div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
												<h3 className="font-semibold text-white">
													Notifications
												</h3>
												{notificationCounts.total > 0 && (
													<span className="text-xs bg-red-500 px-2 py-0.5 rounded-full">
														{notificationCounts.total} new
													</span>
												)}
											</div>

											{/* Content */}
											<div className="overflow-y-auto flex-1">
												{notificationsLoading ? (
													<div className="flex items-center justify-center py-8">
														<Loader2 className="w-6 h-6 animate-spin text-orange-500" />
													</div>
												) : notifications.length === 0 ? (
													<div className="text-center py-8 text-gray-400">
														<Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
														<p>No notifications</p>
														<p className="text-sm">You're all caught up!</p>
													</div>
												) : (
													<div className="divide-y divide-gray-700">
														{notifications.map((notification) => {
															const isLoading =
																actionLoadingId === notification.id;
															return (
																<div
																	key={notification.id}
																	className="p-4 hover:bg-gray-700/50 transition-colors"
																>
																	<div className="flex gap-3">
																		{/* Avatar */}
																		<div className="flex-shrink-0">
																			{notification.data.fromUser?.avatar_url ? (
																				<img
																					src={
																						notification.data.fromUser.avatar_url
																					}
																					alt=""
																					className="w-10 h-10 rounded-full"
																				/>
																			) : (
																				<div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
																					{getNotificationIcon(notification.type)}
																				</div>
																			)}
																		</div>

																		{/* Content */}
																		<div className="flex-1 min-w-0">
																			<div className="flex items-center gap-2 mb-1">
																				{getNotificationIcon(notification.type)}
																				<span className="text-xs font-medium text-gray-400">
																					{notification.title}
																				</span>
																				<span className="text-xs text-gray-500">
																					{formatRelativeTime(
																						notification.createdAt
																					)}
																				</span>
																			</div>
																			<p className="text-sm text-white mb-2 line-clamp-2">
																				{notification.message}
																			</p>

																			{/* Action Buttons */}
																			{notification.type === "friend_request" &&
																				notification.data.friendshipId && (
																					<div className="flex gap-2">
																						<button
																							onClick={(e) =>
																								handleAcceptFriend(
																									e,
																									notification.data.friendshipId!
																								)
																							}
																							disabled={isLoading}
																							className="flex-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
																						>
																							{isLoading ? (
																								<Loader2 className="w-4 h-4 animate-spin" />
																							) : (
																								<CheckCircle size={14} />
																							)}
																							Accept
																						</button>
																						<button
																							onClick={(e) =>
																								handleDeclineFriend(
																									e,
																									notification.data.friendshipId!
																								)
																							}
																							disabled={isLoading}
																							className="flex-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
																						>
																							<XCircle size={14} />
																							Decline
																						</button>
																					</div>
																				)}

																			{notification.type === "bet_invitation" &&
																				notification.data.betId && (
																					<div className="flex gap-2">
																						<button
																							onClick={(e) =>
																								handleAcceptBet(
																									e,
																									notification.data.betId!
																								)
																							}
																							disabled={isLoading}
																							className="flex-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
																						>
																							{isLoading ? (
																								<Loader2 className="w-4 h-4 animate-spin" />
																							) : (
																								<CheckCircle size={14} />
																							)}
																							Accept
																						</button>
																						<button
																							onClick={(e) =>
																								handleDeclineBet(
																									e,
																									notification.data.betId!
																								)
																							}
																							disabled={isLoading}
																							className="flex-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
																						>
																							<XCircle size={14} />
																							Decline
																						</button>
																					</div>
																				)}

																			{notification.type === "bet_resolution" &&
																				notification.data.betId && (
																					<Link
																						to="/bets/$betId"
																						params={{
																							betId: notification.data.betId,
																						}}
																						onClick={() =>
																							setIsNotificationsOpen(false)
																						}
																						className="inline-flex px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg items-center gap-1 transition-colors"
																					>
																						<CheckCircle size={14} />
																						Review & Confirm
																					</Link>
																				)}
																		</div>
																	</div>
																</div>
															);
														})}
													</div>
												)}
											</div>

											{/* Footer */}
											{notifications.length > 0 && (
												<div className="px-4 py-3 border-t border-gray-700">
													<Link
														to="/friends"
														onClick={() => setIsNotificationsOpen(false)}
														className="text-sm text-orange-500 hover:text-orange-400 font-medium"
													>
														View all activity
													</Link>
												</div>
											)}
										</div>
									)}
								</div>

								{/* Avatar with Dropdown */}
								<div className="relative" ref={dropdownRef}>
									<button
										onClick={() => setIsDropdownOpen(!isDropdownOpen)}
										className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-700 transition-colors"
										aria-label="User menu"
									>
										<img
											src={avatarUrl}
											alt={displayName}
											className="w-10 h-10 rounded-full bg-gray-600"
										/>
									</button>

									{/* Dropdown Menu */}
									{isDropdownOpen && (
										<div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2 z-50">
											{/* User Info */}
											<div className="px-4 py-3 border-b border-gray-700">
												<p className="font-medium text-white">{displayName}</p>
												<p className="text-sm text-gray-400">@{username}</p>
											</div>

											{/* Logout Button */}
											<button
												onClick={() => {
													setIsDropdownOpen(false);
													handleSignOut();
												}}
												className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
											>
												<LogOut size={18} />
												<span>Sign Out</span>
											</button>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</header>

			{/* Mobile Sidebar */}
			<aside
				className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				{/* Sidebar Header */}
				<div className="flex items-center justify-between p-4 border-b border-gray-700">
					<span className="text-2xl font-bold text-orange-500">IBetU</span>
					<button
						onClick={() => setIsOpen(false)}
						className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
						aria-label="Close menu"
					>
						<X size={24} />
					</button>
				</div>

				{/* User Profile (only for authenticated) */}
				{!isPublicPage && (
					<div className="p-4 border-b border-gray-700">
						<div className="flex items-center gap-3">
							<img
								src={avatarUrl}
								alt={displayName}
								className="w-12 h-12 rounded-full bg-gray-600"
							/>
							<div>
								<p className="font-medium">{displayName}</p>
								<p className="text-sm text-gray-400">@{username}</p>
							</div>
						</div>
					</div>
				)}

				{/* Mobile Notifications Summary (only for authenticated) */}
				{!isPublicPage && notificationCounts.total > 0 && (
					<div className="p-4 border-b border-gray-700 bg-gray-800/50">
						<p className="text-sm font-medium text-orange-400 mb-2">
							Pending Actions ({notificationCounts.total})
						</p>
						<div className="space-y-1 text-sm text-gray-300">
							{notificationCounts.friendRequests > 0 && (
								<Link
									to="/friends"
									onClick={() => setIsOpen(false)}
									className="flex items-center gap-2 hover:text-white"
								>
									<UserPlus size={14} />
									{notificationCounts.friendRequests} friend request
									{notificationCounts.friendRequests > 1 ? "s" : ""}
								</Link>
							)}
							{notificationCounts.betInvitations > 0 && (
								<Link
									to="/bets"
									onClick={() => setIsOpen(false)}
									className="flex items-center gap-2 hover:text-white"
								>
									<Trophy size={14} />
									{notificationCounts.betInvitations} bet invitation
									{notificationCounts.betInvitations > 1 ? "s" : ""}
								</Link>
							)}
							{notificationCounts.betResolutions > 0 && (
								<Link
									to="/bets"
									onClick={() => setIsOpen(false)}
									className="flex items-center gap-2 hover:text-white"
								>
									<CheckCircle size={14} />
									{notificationCounts.betResolutions} bet
									{notificationCounts.betResolutions > 1 ? "s" : ""} to confirm
								</Link>
							)}
						</div>
					</div>
				)}

				{/* Navigation */}
				<nav className="flex-1 p-4 overflow-y-auto">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = location.pathname === item.to;
						return (
							<Link
								key={item.to}
								to={item.to}
								onClick={() => setIsOpen(false)}
								className={`flex items-center gap-3 p-3 rounded-lg transition-colors mb-2 ${
									isActive
										? "bg-orange-500 text-white"
										: "text-gray-300 hover:bg-gray-800 hover:text-white"
								}`}
							>
								<Icon size={20} />
								<span className="font-medium">{item.label}</span>
							</Link>
						);
					})}

					{/* Create Bet Button (only for authenticated) */}
					{!isPublicPage && (
						<Link
							to="/bets/create"
							search={{ friendId: undefined }}
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 p-3 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors mt-4"
						>
							<Plus size={20} />
							<span className="font-medium">Create New Bet</span>
						</Link>
					)}

					{/* Sign Up Button (only for public) */}
					{isPublicPage && !isAuthPage && (
						<Link
							to="/auth/signup"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 p-3 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors mt-4"
						>
							<span className="font-medium">Get Started</span>
						</Link>
					)}

					{/* Sign Out Button (only for authenticated) */}
					{!isPublicPage && (
						<button
							onClick={handleSignOut}
							className="flex items-center gap-3 p-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors mt-4 w-full"
						>
							<LogOut size={20} />
							<span className="font-medium">Sign Out</span>
						</button>
					)}
				</nav>
			</aside>

			{/* Overlay */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black/50 z-40 md:hidden"
					onClick={() => setIsOpen(false)}
				/>
			)}

			{/* Mobile Notifications Dropdown Overlay */}
			{isNotificationsOpen && (
				<div
					className="fixed inset-0 bg-black/50 z-40 md:hidden"
					onClick={() => setIsNotificationsOpen(false)}
				/>
			)}

			{/* Mobile Notifications Panel */}
			{isNotificationsOpen && (
				<div className="fixed top-16 left-0 right-0 bg-gray-800 z-50 md:hidden max-h-[70vh] overflow-hidden flex flex-col border-b border-gray-700 shadow-lg">
					{/* Header */}
					<div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
						<h3 className="font-semibold text-white">Notifications</h3>
						<button
							onClick={() => setIsNotificationsOpen(false)}
							className="p-1 hover:bg-gray-700 rounded"
						>
							<X size={20} />
						</button>
					</div>

					{/* Content */}
					<div className="overflow-y-auto flex-1">
						{notificationsLoading ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="w-6 h-6 animate-spin text-orange-500" />
							</div>
						) : notifications.length === 0 ? (
							<div className="text-center py-8 text-gray-400">
								<Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
								<p>No notifications</p>
								<p className="text-sm">You're all caught up!</p>
							</div>
						) : (
							<div className="divide-y divide-gray-700">
								{notifications.map((notification) => {
									const isLoading = actionLoadingId === notification.id;
									return (
										<div
											key={notification.id}
											className="p-4 hover:bg-gray-700/50 transition-colors"
										>
											<div className="flex gap-3">
												{/* Avatar */}
												<div className="flex-shrink-0">
													{notification.data.fromUser?.avatar_url ? (
														<img
															src={notification.data.fromUser.avatar_url}
															alt=""
															className="w-10 h-10 rounded-full"
														/>
													) : (
														<div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
															{getNotificationIcon(notification.type)}
														</div>
													)}
												</div>

												{/* Content */}
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-1">
														{getNotificationIcon(notification.type)}
														<span className="text-xs font-medium text-gray-400">
															{notification.title}
														</span>
														<span className="text-xs text-gray-500">
															{formatRelativeTime(notification.createdAt)}
														</span>
													</div>
													<p className="text-sm text-white mb-2">
														{notification.message}
													</p>

													{/* Action Buttons */}
													{notification.type === "friend_request" &&
														notification.data.friendshipId && (
															<div className="flex gap-2">
																<button
																	onClick={(e) =>
																		handleAcceptFriend(
																			e,
																			notification.data.friendshipId!
																		)
																	}
																	disabled={isLoading}
																	className="flex-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
																>
																	{isLoading ? (
																		<Loader2 className="w-4 h-4 animate-spin" />
																	) : (
																		<CheckCircle size={14} />
																	)}
																	Accept
																</button>
																<button
																	onClick={(e) =>
																		handleDeclineFriend(
																			e,
																			notification.data.friendshipId!
																		)
																	}
																	disabled={isLoading}
																	className="flex-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
																>
																	<XCircle size={14} />
																	Decline
																</button>
															</div>
														)}

													{notification.type === "bet_invitation" &&
														notification.data.betId && (
															<div className="flex gap-2">
																<button
																	onClick={(e) =>
																		handleAcceptBet(
																			e,
																			notification.data.betId!
																		)
																	}
																	disabled={isLoading}
																	className="flex-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
																>
																	{isLoading ? (
																		<Loader2 className="w-4 h-4 animate-spin" />
																	) : (
																		<CheckCircle size={14} />
																	)}
																	Accept
																</button>
																<button
																	onClick={(e) =>
																		handleDeclineBet(
																			e,
																			notification.data.betId!
																		)
																	}
																	disabled={isLoading}
																	className="flex-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
																>
																	<XCircle size={14} />
																	Decline
																</button>
															</div>
														)}

													{notification.type === "bet_resolution" &&
														notification.data.betId && (
															<Link
																to="/bets/$betId"
																params={{
																	betId: notification.data.betId,
																}}
																onClick={() => setIsNotificationsOpen(false)}
																className="inline-flex px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg items-center gap-1 transition-colors"
															>
																<CheckCircle size={14} />
																Review & Confirm
															</Link>
														)}
												</div>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>
			)}
		</>
	);
}
