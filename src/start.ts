import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createStart } from "@tanstack/react-start";

export const startInstance = createStart(() => {
	return {
		requestMiddleware: [
			clerkMiddleware({
				// Explicitly pass secretKey from process.env
				// With nodejs_compat_populate_process_env flag, this should work
				secretKey: process.env.CLERK_SECRET_KEY,
			}),
		],
	};
});
