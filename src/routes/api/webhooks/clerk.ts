import { createAPIFileRoute } from "@tanstack/react-start/api";
import { Webhook } from "svix";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../lib/database.types";

interface ClerkUserEventData {
	id: string;
	email_addresses: Array<{
		email_address: string;
		id: string;
	}>;
	first_name: string | null;
	last_name: string | null;
	username: string | null;
	image_url: string | null;
}

interface ClerkWebhookEvent {
	type: string;
	data: ClerkUserEventData;
}

export const APIRoute = createAPIFileRoute("/api/webhooks/clerk")({
	POST: async ({ request }) => {
		const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

		if (!WEBHOOK_SECRET) {
			console.error("Missing CLERK_WEBHOOK_SECRET");
			return new Response("Missing webhook secret", { status: 500 });
		}

		// Get headers
		const svix_id = request.headers.get("svix-id");
		const svix_timestamp = request.headers.get("svix-timestamp");
		const svix_signature = request.headers.get("svix-signature");

		if (!svix_id || !svix_timestamp || !svix_signature) {
			return new Response("Missing svix headers", { status: 400 });
		}

		// Get body
		const body = await request.text();

		// Verify webhook
		const wh = new Webhook(WEBHOOK_SECRET);
		let evt: ClerkWebhookEvent;

		try {
			evt = wh.verify(body, {
				"svix-id": svix_id,
				"svix-timestamp": svix_timestamp,
				"svix-signature": svix_signature,
			}) as ClerkWebhookEvent;
		} catch (err) {
			console.error("Webhook verification failed:", err);
			return new Response("Invalid signature", { status: 400 });
		}

		// Create Supabase admin client
		const supabaseUrl = process.env.SUPABASE_URL;
		const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

		if (!supabaseUrl || !supabaseServiceKey) {
			console.error("Missing Supabase credentials");
			return new Response("Missing database credentials", { status: 500 });
		}

		const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		});

		// Handle events
		const eventType = evt.type;
		const userData = evt.data;

		if (eventType === "user.created") {
			const email = userData.email_addresses[0]?.email_address || "";
			const displayName = [userData.first_name, userData.last_name]
				.filter(Boolean)
				.join(" ") || email.split("@")[0];

			// Generate username from Clerk username or email
			const username = userData.username || email.split("@")[0] + "_" + userData.id.slice(-4);

			const { error } = await supabaseAdmin.from("users").insert({
				id: userData.id,
				email: email,
				display_name: displayName,
				username: username,
				avatar_url: userData.image_url,
			});

			if (error) {
				console.error("Failed to create user:", error);
				return new Response("Failed to create user", { status: 500 });
			}

			console.log("User created:", userData.id);
		}

		if (eventType === "user.updated") {
			const email = userData.email_addresses[0]?.email_address || "";
			const displayName = [userData.first_name, userData.last_name]
				.filter(Boolean)
				.join(" ") || undefined;

			const { error } = await supabaseAdmin
				.from("users")
				.update({
					email: email,
					display_name: displayName,
					username: userData.username || undefined,
					avatar_url: userData.image_url,
				})
				.eq("id", userData.id);

			if (error) {
				console.error("Failed to update user:", error);
				return new Response("Failed to update user", { status: 500 });
			}

			console.log("User updated:", userData.id);
		}

		if (eventType === "user.deleted") {
			const { error } = await supabaseAdmin
				.from("users")
				.delete()
				.eq("id", userData.id);

			if (error) {
				console.error("Failed to delete user:", error);
				return new Response("Failed to delete user", { status: 500 });
			}

			console.log("User deleted:", userData.id);
		}

		return new Response("OK", { status: 200 });
	},
});
