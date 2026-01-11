import { createFileRoute, Link } from "@tanstack/react-router";
import { SignUp } from "@clerk/tanstack-react-start";
import { ArrowLeft } from "lucide-react";

type SignUpSearch = {
	redirect_url?: string;
};

export const Route = createFileRoute("/auth/signup/")({
	component: SignUpPage,
	validateSearch: (search: Record<string, unknown>): SignUpSearch => {
		return {
			redirect_url: typeof search.redirect_url === "string" ? search.redirect_url : undefined,
		};
	},
});

function SignUpPage() {
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
					<SignUp
						routing="path"
						path="/auth/signup"
						signInUrl="/auth/login"
						forceRedirectUrl={redirectUrl}
					/>
				</div>
			</div>
		</div>
	);
}
