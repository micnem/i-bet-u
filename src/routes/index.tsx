import { createFileRoute, Link } from "@tanstack/react-router";
import {
	UserPlus,
	Send,
	Bell,
	Handshake,
	Shield,
	Users,
	Trophy,
	ArrowRight,
	CheckCircle,
	Medal,
	Zap,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: LandingPage });

function LandingPage() {
	return (
		<div className="min-h-screen">
			{/* Hero Section */}
			<section className="bg-gradient-to-br from-gray-50 to-gray-100 py-16 px-6">
				<div className="max-w-4xl mx-auto">
					<h1 className="text-5xl md:text-6xl font-bold text-orange-500 mb-6">
						IBetU
					</h1>
					<p className="text-xl md:text-2xl text-gray-700 mb-4 max-w-2xl font-medium">
						Turn friendly wagers into unforgettable moments.
					</p>
					<p className="text-lg text-gray-600 mb-8 max-w-2xl">
						The fun way to make bets with friends, family, and colleagues — track
						everything, climb the leaderboards, and never let anyone forget who
						called it first.
					</p>
					<div className="flex flex-col sm:flex-row gap-4">
						<Link
							to="/auth/signup"
							className="ibetu-btn-primary inline-flex items-center justify-center gap-2"
						>
							Get Started Free
							<ArrowRight size={20} />
						</Link>
						<Link
							to="/auth/login"
							className="ibetu-btn-outline inline-flex items-center justify-center"
						>
							Sign In
						</Link>
					</div>
				</div>
			</section>

			{/* Intro Section */}
			<section className="bg-orange-500 py-16 px-6 text-white">
				<div className="max-w-4xl mx-auto">
					<div className="bg-white rounded-xl p-8 text-gray-800 shadow-lg">
						<h2 className="text-3xl font-bold text-gray-800 mb-6">
							The Problem with Friendly Bets
						</h2>
						<p className="text-lg mb-4">
							"I bet you $20 the Lakers win tonight." Sound familiar? We've all
							made these casual wagers with friends — but what happens next?
						</p>
						<p className="text-lg mb-6">
							The bet gets forgotten, nobody tracks who won, and bragging rights
							disappear into thin air. Until now.
						</p>

						<div className="space-y-4">
							<div className="flex items-start gap-3">
								<CheckCircle className="text-orange-500 mt-1 flex-shrink-0" />
								<p className="text-orange-500 font-medium">
									Every bet recorded with clear terms and stakes
								</p>
							</div>
							<div className="flex items-start gap-3">
								<CheckCircle className="text-orange-500 mt-1 flex-shrink-0" />
								<p className="text-orange-500 font-medium">
									Both parties approve the outcome — no more "I never said that!"
								</p>
							</div>
							<div className="flex items-start gap-3">
								<CheckCircle className="text-orange-500 mt-1 flex-shrink-0" />
								<p className="text-orange-500 font-medium">
									Build your reputation on the leaderboard as the ultimate predictor
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Step One */}
			<section className="bg-gray-800 py-16 px-6 text-white">
				<div className="max-w-4xl mx-auto">
					<div className="flex flex-col md:flex-row items-center gap-8">
						<div className="flex-1">
							<span className="text-gray-400">—</span>
							<h2 className="text-4xl font-bold text-orange-500 mb-6">
								Step one:
							</h2>
							<ol className="text-lg space-y-2 text-orange-400">
								<li className="flex gap-2">
									<span className="font-bold">1)</span>
									You build yourself a quick profile
								</li>
								<li className="flex gap-2">
									<span className="font-bold">2)</span>
									<span>
										You add your friends by QR, Phone number or Nickname
									</span>
								</li>
							</ol>
						</div>
						<div className="flex-1 flex justify-center">
							<div className="bg-white rounded-xl p-8 shadow-lg">
								<div className="flex flex-col items-center">
									<UserPlus className="w-16 h-16 text-cyan-500 mb-4" />
									<button className="px-6 py-2 bg-cyan-500 text-white rounded-full font-medium mb-2">
										Sign Up
									</button>
									<span className="text-gray-600">Register now!</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Step Two */}
			<section className="bg-gray-700 py-16 px-6 text-white">
				<div className="max-w-4xl mx-auto">
					<div className="flex flex-col md:flex-row items-center gap-8">
						<div className="flex-1">
							<span className="text-gray-400">—</span>
							<h2 className="text-4xl font-bold text-orange-500 mb-6">
								Step two:
							</h2>
							<ol className="text-lg space-y-2 text-orange-400">
								<li className="flex gap-2">
									<span className="font-bold">1)</span>
									Pick something to bet on — sports, trivia, predictions, anything!
								</li>
								<li className="flex gap-2">
									<span className="font-bold">2)</span>
									Challenge your friend with a bet invite.
								</li>
							</ol>
							<ul className="mt-4 space-y-1 text-orange-400">
								<li className="flex gap-2">
									<span className="text-white">•</span>
									Define what you're betting on
								</li>
								<li className="flex gap-2">
									<span className="text-white">•</span>
									Set the stakes (bragging rights, favors, or anything you agree on)
								</li>
								<li className="flex gap-2">
									<span className="text-white">•</span>
									Set a deadline
								</li>
								<li className="flex gap-2">
									<span className="text-white">•</span>
									Choose how the winner is decided
								</li>
							</ul>
						</div>
						<div className="flex-1 flex justify-center">
							<div className="bg-white rounded-xl p-4 shadow-lg max-w-xs">
								<div className="border-b pb-2 mb-4">
									<span className="text-gray-800 font-medium">Sports Bet</span>
									<div className="text-right text-gray-600 text-sm">
										Stakes
										<div className="text-orange-500 font-bold">Loser buys lunch</div>
									</div>
								</div>
								<div className="text-center py-4">
									<span className="text-gray-500">Basketball</span>
									<div className="flex items-center justify-center gap-4 my-4">
										<div className="text-center">
											<div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
												<Trophy className="w-5 h-5 text-blue-500" />
											</div>
											<div className="text-xs text-gray-600 mt-1">
												Lakers
											</div>
										</div>
										<span className="text-xl font-bold text-gray-400">VS</span>
										<div className="text-center">
											<div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
												<Trophy className="w-5 h-5 text-red-500" />
											</div>
											<div className="text-xs text-gray-600 mt-1">
												Celtics
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Step Three */}
			<section className="bg-gray-800 py-16 px-6 text-white">
				<div className="max-w-4xl mx-auto">
					<div className="flex flex-col md:flex-row items-center gap-8">
						<div className="flex-1">
							<span className="text-gray-400">—</span>
							<h2 className="text-4xl font-bold text-orange-500 mb-6">
								Step three:
							</h2>
							<ol className="text-lg space-y-2 text-orange-400">
								<li className="flex gap-2">
									<span className="font-bold">1)</span>
									Track your bets and get nudge reminders when deadlines approach
								</li>
								<li className="flex gap-2">
									<span className="font-bold">2)</span>
									Settle the bet — both approve the winner
								</li>
								<li className="flex gap-2">
									<span className="font-bold">3)</span>
									Climb the leaderboard and cement your legacy!
								</li>
							</ol>
						</div>
						<div className="flex-1 flex justify-center">
							<div className="bg-gradient-to-br from-orange-400 to-yellow-500 rounded-xl p-6 shadow-lg">
								<Medal className="w-16 h-16 text-white mb-4" />
								<div className="text-white">
									<div className="text-lg font-bold">Leaderboard</div>
									<div className="text-sm mt-2 space-y-1">
										<div className="flex items-center gap-2">
											<span className="text-yellow-200">🥇</span> 12 wins
										</div>
										<div className="flex items-center gap-2">
											<span className="text-gray-200">🥈</span> 8 wins
										</div>
										<div className="flex items-center gap-2">
											<span className="text-orange-200">🥉</span> 5 wins
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Grid */}
			<section className="bg-gray-50 py-16 px-6">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
						Why Choose IBetU?
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<div className="bg-white rounded-xl p-6 shadow-md text-center">
							<div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Bell className="w-7 h-7 text-orange-500" />
							</div>
							<h3 className="font-bold text-lg mb-2">Nudge Reminders</h3>
							<p className="text-gray-600 text-sm">
								Never forget a bet again. Get timely reminders as deadlines
								approach and nudge friends to settle up.
							</p>
						</div>
						<div className="bg-white rounded-xl p-6 shadow-md text-center">
							<div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Trophy className="w-7 h-7 text-orange-500" />
							</div>
							<h3 className="font-bold text-lg mb-2">Leaderboards</h3>
							<p className="text-gray-600 text-sm">
								Compete with friends and climb the rankings. Show off your
								prediction skills and bragging rights.
							</p>
						</div>
						<div className="bg-white rounded-xl p-6 shadow-md text-center">
							<div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Users className="w-7 h-7 text-orange-500" />
							</div>
							<h3 className="font-bold text-lg mb-2">Friend-to-Friend</h3>
							<p className="text-gray-600 text-sm">
								Bet with people you know and trust. Add friends via QR, phone,
								or nickname.
							</p>
						</div>
						<div className="bg-white rounded-xl p-6 shadow-md text-center">
							<div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Handshake className="w-7 h-7 text-orange-500" />
							</div>
							<h3 className="font-bold text-lg mb-2">Fair & Transparent</h3>
							<p className="text-gray-600 text-sm">
								Clear bet terms and mutual approval of outcomes. No more
								disputed results.
							</p>
						</div>
						<div className="bg-white rounded-xl p-6 shadow-md text-center">
							<div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Zap className="w-7 h-7 text-orange-500" />
							</div>
							<h3 className="font-bold text-lg mb-2">Quick & Easy</h3>
							<p className="text-gray-600 text-sm">
								Create a bet in seconds. Simple interface, no complicated
								setup required.
							</p>
						</div>
						<div className="bg-white rounded-xl p-6 shadow-md text-center">
							<div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Shield className="w-7 h-7 text-orange-500" />
							</div>
							<h3 className="font-bold text-lg mb-2">Bet History</h3>
							<p className="text-gray-600 text-sm">
								Keep a permanent record of all your bets. Look back on your
								greatest predictions.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="bg-orange-500 py-16 px-6">
				<div className="max-w-4xl mx-auto text-center">
					<h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
						Ready to prove you called it?
					</h2>
					<p className="text-xl text-orange-100 mb-8">
						Join IBetU — track your bets, climb the leaderboard, and never let
						a friend forget who was right.
					</p>
					<Link
						to="/auth/signup"
						className="inline-flex items-center gap-2 px-8 py-4 bg-white text-orange-500 font-bold rounded-lg hover:bg-gray-100 transition-colors text-lg"
					>
						<CheckCircle size={24} />
						Start Betting Free
					</Link>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-gray-900 py-8 px-6 text-center text-gray-400">
				<p>&copy; 2026 IBetU. All rights reserved.</p>
				<p className="text-sm mt-2">Making friendly wagers unforgettable.</p>
			</footer>
		</div>
	);
}
