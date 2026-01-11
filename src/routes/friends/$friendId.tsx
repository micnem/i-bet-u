import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/friends/$friendId")({
	component: FriendHistoryPage,
});

function FriendHistoryPage() {
	const { friendId } = Route.useParams();

	return (
		<div className="min-h-screen bg-gray-100 flex items-center justify-center">
			<div className="text-center">
				<h2 className="text-xl font-semibold text-gray-800 mb-2">
					Friend not found
				</h2>
				<Link to="/friends" className="ibetu-btn-primary">
					Back to Friends
				</Link>
			</div>
		</div>
	);
}
