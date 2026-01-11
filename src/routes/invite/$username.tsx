import { createFileRoute, Link } from "@tanstack/react-router";
import { Users } from "lucide-react";

export const Route = createFileRoute("/invite/$username")({
	component: InvitePage,
});

function InvitePage() {
	const { username } = Route.useParams();

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
