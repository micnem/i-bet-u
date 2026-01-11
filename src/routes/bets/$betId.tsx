import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/bets/$betId")({
	component: BetDetailsPage,
});

function BetDetailsPage() {
	const { betId } = Route.useParams();

	return (
		<div className="min-h-screen bg-gray-100 flex items-center justify-center">
			<div className="text-center">
				<AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
				<h2 className="text-xl font-semibold text-gray-800 mb-2">
					Bet not found
				</h2>
				<p className="text-gray-500 mb-4">
					This bet doesn't exist or has been removed.
				</p>
				<Link to="/bets" className="ibetu-btn-primary">
					Back to Bets
				</Link>
			</div>
		</div>
	);
}
