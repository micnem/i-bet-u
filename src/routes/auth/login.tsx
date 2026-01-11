import { createFileRoute, Link } from "@tanstack/react-router";
import { SignIn } from "@clerk/tanstack-react-start";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/auth/login")({ component: LoginPage });

function LoginPage() {
	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4">
			<div className="max-w-md mx-auto">
				<Link
					to="/"
					className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
				>
					<ArrowLeft size={20} />
					Back to Home
				</Link>

				<div className="flex justify-center">
					<SignIn
						routing="path"
						path="/auth/login"
						signUpUrl="/auth/signup"
						forceRedirectUrl="/dashboard"
					/>
				</div>
			</div>
		</div>
	);
}
