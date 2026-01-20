// Auth guard component for protecting routes
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useUser } from "./AuthProvider";

interface AuthGuardProps {
	children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
	const { isSignedIn, isLoaded } = useUser();
	const navigate = useNavigate();

	useEffect(() => {
		if (isLoaded && !isSignedIn) {
			navigate({ to: "/auth/login" });
		}
	}, [isLoaded, isSignedIn, navigate]);

	// Show loading spinner while checking auth
	if (!isLoaded) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	// If not signed in, show nothing (will redirect)
	if (!isSignedIn) {
		return null;
	}

	return <>{children}</>;
}
