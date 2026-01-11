import { useClerk, useUser } from "@clerk/tanstack-react-start";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
	Home,
	LogIn,
	LogOut,
	Medal,
	Menu,
	Plus,
	Trophy,
	User,
	Users,
	X,
} from "lucide-react";
import { useState } from "react";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const location = useLocation();
	const navigate = useNavigate();
	const { user, isSignedIn } = useUser();
	const { signOut } = useClerk();

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
		`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

	const handleSignOut = async () => {
		await signOut();
		setIsOpen(false);
		navigate({ to: "/" });
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
							<button
								onClick={() => setIsOpen(true)}
								className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
								aria-label="Open menu"
							>
								<Menu size={24} />
							</button>
						</div>

						{/* Desktop Avatar (only for authenticated) */}
						{!isPublicPage && (
							<div className="hidden md:flex items-center gap-3">
								<img
									src={avatarUrl}
									alt={displayName}
									className="w-10 h-10 rounded-full bg-gray-600"
								/>
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
		</>
	);
}
