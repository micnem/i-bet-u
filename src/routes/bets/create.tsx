import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Users } from "lucide-react";

export const Route = createFileRoute("/bets/create")({
	component: CreateBetPage,
	validateSearch: (search: Record<string, unknown>) => ({
		friendId: search.friendId as string | undefined,
	}),
});

function CreateBetPage() {
	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header */}
			<div className="bg-white shadow">
				<div className="max-w-2xl mx-auto px-6 py-4">
					<Link
						to="/dashboard"
						className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
					>
						<ArrowLeft size={20} />
						Back
					</Link>
					<h1 className="text-2xl font-bold text-gray-800">Create New Bet</h1>
				</div>
			</div>

			<div className="max-w-2xl mx-auto px-6 py-8">
				<div className="bg-white rounded-xl shadow-md p-6">
					<div className="flex items-center gap-3 mb-6">
						<div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
							<Users className="w-5 h-5 text-orange-500" />
						</div>
						<div>
							<h2 className="text-lg font-semibold">Select Opponent</h2>
							<p className="text-sm text-gray-500">
								Choose a friend to bet against
							</p>
						</div>
					</div>

					<div className="text-center py-8 text-gray-500">
						<Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
						<p>No friends yet</p>
						<p className="text-sm mt-2">Add friends first to create bets</p>
						<Link
							to="/friends"
							className="ibetu-btn-primary inline-flex items-center gap-2 mt-4"
						>
							Add Friends
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
