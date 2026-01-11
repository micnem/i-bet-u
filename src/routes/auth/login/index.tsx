import { createFileRoute, Link } from "@tanstack/react-router";
import { SignIn } from "@clerk/tanstack-react-start";
import { ArrowLeft } from "lucide-react";

type LoginSearch = {
	redirect_url?: string;
};

export const Route = createFileRoute("/auth/login/")({
	component: LoginPage,
	validateSearch: (search: Record<string, unknown>): LoginSearch => {
		return {
			redirect_url: typeof search.redirect_url === "string" ? search.redirect_url : undefined,
		};
	},
});

function LoginPage() {
	const { redirect_url } = Route.useSearch();

	// Use redirect_url if provided, otherwise default to dashboard
	const redirectUrl = redirect_url || "/dashboard";

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
						signUpUrl={redirect_url ? `/auth/signup?redirect_url=${encodeURIComponent(redirect_url)}` : "/auth/signup"}
						forceRedirectUrl={redirectUrl}
					/>
				</div>
			</div>
		</div>
	);
}
