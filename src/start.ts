import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createMiddleware, createStart } from "@tanstack/react-start";

// Error logging middleware - logs full error details with stack traces
// Based on: https://tanstack.com/start/latest/docs/framework/react/guide/observability
const errorLoggingMiddleware = createMiddleware().server(
	async ({ request, next }) => {
		const timestamp = new Date().toISOString();
		const startTime = Date.now();

		try {
			const result = await next();
			return result;
		} catch (error) {
			const duration = Date.now() - startTime;
			console.error("=== SERVER ERROR ===");
			console.error(
				`[${timestamp}] ${request.method} ${request.url} - Error (${duration}ms)`
			);
			console.error("Error:", error);
			if (error instanceof Error) {
				console.error("Message:", error.message);
				console.error("Stack:", error.stack);
				if ("cause" in error) {
					console.error("Cause:", error.cause);
				}
			}
			console.error("===================");
			throw error;
		}
	}
);

export const startInstance = createStart(() => {
	return {
		requestMiddleware: [
			// Error logging should be first to catch all errors
			errorLoggingMiddleware,
			clerkMiddleware({
				secretKey: process.env.CLERK_SECRET_KEY,
			}),
		],
	};
});
