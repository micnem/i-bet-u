import { createFileRoute, Link } from "@tanstack/react-router";
import {
	UserPlus,
	Send,
	CreditCard,
	Handshake,
	Shield,
	Users,
	Trophy,
	ArrowRight,
	CheckCircle,
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
					<p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-2xl">
						A website and application where friends, spouses, colleagues, family
						members get to do bets on random outcomes against each other.
					</p>
					<div className="flex flex-col sm:flex-row gap-4">
						<Link
							to="/auth/signup"
							className="ibetu-btn-primary inline-flex items-center justify-center gap-2"
						>
							Get Started
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
						<h2 className="text-3xl font-bold text-gray-800 mb-6">1. Intro</h2>
						<p className="text-lg mb-4">
							How often does a person in your close setting tells you let's bet
							on this or that?
						</p>
						<p className="text-lg mb-6">
							Yet even though you win the bet you don't get any benefit due to
							not being done officially or a way to track it.
						</p>

						<div className="space-y-4">
							<div className="flex items-start gap-3">
								<ArrowRight className="text-orange-500 mt-1 flex-shrink-0" />
								<p className="text-orange-500 font-medium">
									Clear definition of the bet and the winnings.
								</p>
							</div>
							<div className="flex items-start gap-3">
								<ArrowRight className="text-orange-500 mt-1 flex-shrink-0" />
								<p className="text-orange-500 font-medium">
									Both have to approve the winner and if this isn't possible a
									third party verification.
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
									You find something you want to bet on.
								</li>
								<li className="flex gap-2">
									<span className="font-bold">2)</span>
									Send a bet invite to your friend.
								</li>
							</ol>
							<ul className="mt-4 space-y-1 text-orange-400">
								<li className="flex gap-2">
									<span className="text-white">•</span>
									What you are betting on.
								</li>
								<li className="flex gap-2">
									<span className="text-white">•</span>
									The amount
								</li>
								<li className="flex gap-2">
									<span className="text-white">•</span>
									Timeline
								</li>
								<li className="flex gap-2">
									<span className="text-white">•</span>
									How the outcome will be verified
								</li>
							</ul>
						</div>
						<div className="flex-1 flex justify-center">
							<div className="bg-white rounded-xl p-4 shadow-lg max-w-xs">
								<div className="border-b pb-2 mb-4">
									<span className="text-gray-800 font-medium">Sports Bet</span>
									<div className="text-right text-gray-600 text-sm">
										Your Wallet
										<div className="text-orange-500 font-bold">$---</div>
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
												Lorem Team
											</div>
										</div>
										<span className="text-xl font-bold text-gray-400">VS</span>
										<div className="text-center">
											<div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
												<Trophy className="w-5 h-5 text-red-500" />
											</div>
											<div className="text-xs text-gray-600 mt-1">
												Ipsum Team
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
									You put in your credit card details
								</li>
								<li className="flex gap-2">
									<span className="font-bold">2)</span>
									Lastly wait for your friend to accept (and insert his cc
									details)
								</li>
							</ol>
						</div>
						<div className="flex-1 flex justify-center">
							<div className="bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl p-6 shadow-lg">
								<CreditCard className="w-16 h-16 text-white mb-4" />
								<div className="text-white font-mono">
									<div className="text-lg tracking-widest">•••• •••• •••• 4242</div>
									<div className="text-sm mt-2 opacity-80">VALID THRU 12/27</div>
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
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="bg-white rounded-xl p-6 shadow-md text-center">
							<div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Shield className="w-7 h-7 text-orange-500" />
							</div>
							<h3 className="font-bold text-lg mb-2">Secure & Verified</h3>
							<p className="text-gray-600 text-sm">
								All bets are tracked and verified by both parties or third-party
								verification.
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
								Clear bet terms, agreed upon winnings, and mutual approval of
								outcomes.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="bg-orange-500 py-16 px-6">
				<div className="max-w-4xl mx-auto text-center">
					<h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
						Ready to make it official?
					</h2>
					<p className="text-xl text-orange-100 mb-8">
						Join IBetU and never lose track of a bet again.
					</p>
					<Link
						to="/auth/signup"
						className="inline-flex items-center gap-2 px-8 py-4 bg-white text-orange-500 font-bold rounded-lg hover:bg-gray-100 transition-colors text-lg"
					>
						<CheckCircle size={24} />
						Sign Up Now
					</Link>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-gray-900 py-8 px-6 text-center text-gray-400">
				<p>&copy; 2026 IBetU. All rights reserved.</p>
				<p className="text-sm mt-2">Bet responsibly with friends.</p>
			</footer>
		</div>
	);
}
