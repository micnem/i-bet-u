import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, Plus } from "lucide-react";

export const Route = createFileRoute("/bets/")({ component: BetsPage });

function BetsPage() {
	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header */}
			<div className="bg-white shadow">
				<div className="max-w-4xl mx-auto px-6 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-800">My Bets</h1>
							<p className="text-gray-500">0 total bets</p>
						</div>
						<Link
							to="/bets/create"
							className="ibetu-btn-primary inline-flex items-center gap-2"
						>
							<Plus size={20} />
							New Bet
						</Link>
					</div>

					{/* Stats */}
					<div className="grid grid-cols-3 md:grid-cols-5 gap-4 mt-6">
						<div className="bg-orange-50 rounded-lg p-3 text-center">
							<p className="text-2xl font-bold text-orange-500">0</p>
							<p className="text-sm text-gray-600">Active</p>
						</div>
						<div className="bg-yellow-50 rounded-lg p-3 text-center">
							<p className="text-2xl font-bold text-yellow-500">0</p>
							<p className="text-sm text-gray-600">Pending</p>
						</div>
						<div className="bg-gray-50 rounded-lg p-3 text-center">
							<p className="text-2xl font-bold text-gray-500">0</p>
							<p className="text-sm text-gray-600">Completed</p>
						</div>
						<div className="bg-green-50 rounded-lg p-3 text-center">
							<p className="text-2xl font-bold text-green-500">0</p>
							<p className="text-sm text-gray-600">Won</p>
						</div>
						<div className="bg-red-50 rounded-lg p-3 text-center">
							<p className="text-2xl font-bold text-red-500">0</p>
							<p className="text-sm text-gray-600">Lost</p>
						</div>
					</div>
				</div>
			</div>

			{/* Bets List */}
			<div className="max-w-4xl mx-auto px-6 py-8">
				<div className="bg-white rounded-xl shadow-md p-12 text-center">
					<Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
					<h3 className="text-lg font-medium text-gray-800 mb-2">
						No bets found
					</h3>
					<p className="text-gray-500 mb-4">
						Create your first bet to get started!
					</p>
					<Link
						to="/bets/create"
						className="ibetu-btn-primary inline-flex items-center gap-2"
					>
						<Plus size={20} />
						Create a Bet
					</Link>
				</div>
			</div>
		</div>
	);
}
