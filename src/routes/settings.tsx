import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useUser, useAuth } from "../components/AuthProvider";
import {
	ArrowLeft,
	Bell,
	BellOff,
	Loader2,
	Mail,
	Shield,
} from "lucide-react";
import { getCurrentUserProfile, updateEmailPreferences } from "../api/users";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
	const router = useRouter();
	const { user, isSignedIn, isLoaded } = useUser();

	const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState<boolean | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	useEffect(() => {
		if (isLoaded && !isSignedIn) {
			router.navigate({ to: "/auth/login" });
		}
	}, [isSignedIn, isLoaded, router]);

	useEffect(() => {
		async function fetchPreferences() {
			try {
				const result = await getCurrentUserProfile();
				if (result.data) {
					setEmailNotificationsEnabled(result.data.email_notifications_enabled);
				}
			} catch (err) {
				console.error("Failed to fetch preferences:", err);
				setError("Failed to load preferences");
			} finally {
				setLoading(false);
			}
		}

		if (isSignedIn) {
			fetchPreferences();
		}
	}, [isSignedIn]);

	const handleToggleEmailNotifications = async () => {
		if (emailNotificationsEnabled === null) return;

		setSaving(true);
		setError(null);
		setSuccessMessage(null);

		const newValue = !emailNotificationsEnabled;

		try {
			const result = await updateEmailPreferences({
				data: { emailNotificationsEnabled: newValue },
			});

			if (result.error) {
				setError(result.error);
			} else {
				setEmailNotificationsEnabled(newValue);
				setSuccessMessage(
					newValue
						? "Email notifications enabled"
						: "Email notifications disabled"
				);
				// Clear success message after 3 seconds
				setTimeout(() => setSuccessMessage(null), 3000);
			}
		} catch (err) {
			setError("Failed to update preferences");
		} finally {
			setSaving(false);
		}
	};

	if (!isLoaded) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<Loader2 className="w-8 h-8 animate-spin text-orange-500" />
			</div>
		);
	}

	if (!isSignedIn || !user) {
		return null;
	}

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header */}
			<div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-6 px-6">
				<div className="max-w-4xl mx-auto">
					<div className="flex items-center gap-4">
						<Link
							to="/profile"
							className="p-2 hover:bg-white/20 rounded-lg transition-colors"
						>
							<ArrowLeft className="w-6 h-6" />
						</Link>
						<div>
							<h1 className="text-2xl font-bold">Settings</h1>
							<p className="text-orange-100 text-sm">Manage your account preferences</p>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-4xl mx-auto px-6 py-8">
				{/* Error Message */}
				{error && (
					<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
						{error}
						<button
							type="button"
							onClick={() => setError(null)}
							className="ml-2 text-red-500 hover:text-red-700 underline"
						>
							Dismiss
						</button>
					</div>
				)}

				{/* Success Message */}
				{successMessage && (
					<div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
						{successMessage}
					</div>
				)}

				{/* Notifications Section */}
				<div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
					<div className="p-6 border-b border-gray-100">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
								<Bell className="w-5 h-5 text-orange-500" />
							</div>
							<div>
								<h2 className="text-lg font-semibold">Notifications</h2>
								<p className="text-sm text-gray-500">Control how you receive updates</p>
							</div>
						</div>
					</div>

					<div className="p-6">
						{loading ? (
							<div className="flex justify-center py-4">
								<Loader2 className="w-6 h-6 animate-spin text-orange-500" />
							</div>
						) : (
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<Mail className="w-5 h-5 text-gray-400" />
									<div>
										<p className="font-medium text-gray-800">Email Notifications</p>
										<p className="text-sm text-gray-500">
											Receive emails about bet invites, reminders, comments, and results
										</p>
									</div>
								</div>
								<button
									type="button"
									onClick={handleToggleEmailNotifications}
									disabled={saving}
									className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
										emailNotificationsEnabled
											? "bg-orange-500"
											: "bg-gray-200"
									} ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
								>
									{saving ? (
										<span className="absolute inset-0 flex items-center justify-center">
											<Loader2 className="w-4 h-4 animate-spin text-white" />
										</span>
									) : (
										<span
											className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
												emailNotificationsEnabled
													? "translate-x-6"
													: "translate-x-1"
											}`}
										/>
									)}
								</button>
							</div>
						)}
					</div>
				</div>

				{/* Email Types Info */}
				<div className="bg-white rounded-xl shadow-md overflow-hidden">
					<div className="p-6 border-b border-gray-100">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
								<Shield className="w-5 h-5 text-blue-500" />
							</div>
							<div>
								<h2 className="text-lg font-semibold">Email Types</h2>
								<p className="text-sm text-gray-500">
									{emailNotificationsEnabled
										? "You'll receive these emails"
										: "You won't receive these emails"}
								</p>
							</div>
						</div>
					</div>

					<div className="p-6">
						<ul className="space-y-3">
							<li className="flex items-start gap-3">
								<div className={`w-2 h-2 rounded-full mt-2 ${emailNotificationsEnabled ? "bg-green-500" : "bg-gray-300"}`} />
								<div>
									<p className="font-medium text-gray-800">Bet Invitations</p>
									<p className="text-sm text-gray-500">When someone challenges you to a bet</p>
								</div>
							</li>
							<li className="flex items-start gap-3">
								<div className={`w-2 h-2 rounded-full mt-2 ${emailNotificationsEnabled ? "bg-green-500" : "bg-gray-300"}`} />
								<div>
									<p className="font-medium text-gray-800">Bet Accepted</p>
									<p className="text-sm text-gray-500">When someone accepts your bet challenge</p>
								</div>
							</li>
							<li className="flex items-start gap-3">
								<div className={`w-2 h-2 rounded-full mt-2 ${emailNotificationsEnabled ? "bg-green-500" : "bg-gray-300"}`} />
								<div>
									<p className="font-medium text-gray-800">Winner Confirmation</p>
									<p className="text-sm text-gray-500">When someone declares a winner and needs your confirmation</p>
								</div>
							</li>
							<li className="flex items-start gap-3">
								<div className={`w-2 h-2 rounded-full mt-2 ${emailNotificationsEnabled ? "bg-green-500" : "bg-gray-300"}`} />
								<div>
									<p className="font-medium text-gray-800">Payment Reminders</p>
									<p className="text-sm text-gray-500">When a friend reminds you about money owed</p>
								</div>
							</li>
							<li className="flex items-start gap-3">
								<div className={`w-2 h-2 rounded-full mt-2 ${emailNotificationsEnabled ? "bg-green-500" : "bg-gray-300"}`} />
								<div>
									<p className="font-medium text-gray-800">Comments</p>
									<p className="text-sm text-gray-500">When someone comments on your bet</p>
								</div>
							</li>
						</ul>
					</div>
				</div>

				{/* Note about critical emails */}
				<p className="mt-6 text-sm text-gray-500 text-center">
					Note: You may still receive important account-related emails regardless of this setting.
				</p>
			</div>
		</div>
	);
}
