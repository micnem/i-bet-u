import { createServerFn } from "@tanstack/react-start";
import { Resend } from "resend";
import { supabase } from "../lib/supabase";

// Initialize Resend client
const getResendClient = () => {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		throw new Error("RESEND_API_KEY is not configured");
	}
	return new Resend(apiKey);
};

// Send a payment reminder to a friend who owes money
export const sendPaymentReminder = createServerFn({ method: "POST" })
	.validator(
		(data: { friendId: string; amount: number; friendName: string }) => data
	)
	.handler(async ({ data: { friendId, amount, friendName } }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", success: false };
		}

		// Get current user's details
		const { data: currentUser, error: userError } = await supabase
			.from("users")
			.select("display_name, username, email")
			.eq("id", authUser.id)
			.single();

		if (userError || !currentUser) {
			return { error: "Could not fetch user details", success: false };
		}

		// Get friend's email
		const { data: friend, error: friendError } = await supabase
			.from("users")
			.select("email, display_name")
			.eq("id", friendId)
			.single();

		if (friendError || !friend) {
			return { error: "Could not fetch friend details", success: false };
		}

		// Check if a reminder was sent recently (within last 24 hours)
		const { data: recentReminder } = await supabase
			.from("payment_reminders")
			.select("id, created_at")
			.eq("sender_id", authUser.id)
			.eq("recipient_id", friendId)
			.gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
			.maybeSingle();

		if (recentReminder) {
			return {
				error: "You already sent a reminder to this friend in the last 24 hours",
				success: false,
			};
		}

		// Send the email
		try {
			const resend = getResendClient();
			const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@ibetu.app";

			await resend.emails.send({
				from: `iBetU <${fromEmail}>`,
				to: friend.email,
				subject: `${currentUser.display_name} sent you a payment reminder`,
				html: `
					<!DOCTYPE html>
					<html>
					<head>
						<meta charset="utf-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
					</head>
					<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
						<div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
							<h1 style="color: white; margin: 0; font-size: 28px;">iBetU</h1>
						</div>
						<div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
							<h2 style="color: #1f2937; margin-top: 0;">Hey ${friend.display_name}!</h2>
							<p style="font-size: 16px; color: #4b5563;">
								<strong>${currentUser.display_name}</strong> (@${currentUser.username}) is reminding you that you owe them:
							</p>
							<div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
								<span style="font-size: 36px; font-weight: bold; color: #b45309;">$${amount.toFixed(2)}</span>
							</div>
							<p style="font-size: 14px; color: #6b7280;">
								This amount is based on completed bets between you two. Time to settle up!
							</p>
							<div style="text-align: center; margin-top: 30px;">
								<a href="${process.env.APP_URL || "https://ibetu-app.michael-nemni.workers.dev"}/friends"
								   style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
									View on iBetU
								</a>
							</div>
							<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
							<p style="font-size: 12px; color: #9ca3af; text-align: center;">
								You're receiving this email because you're a member of iBetU.
								<br>Don't want these reminders? You can update your preferences in the app.
							</p>
						</div>
					</body>
					</html>
				`,
			});

			// Record the reminder
			await supabase.from("payment_reminders").insert({
				sender_id: authUser.id,
				recipient_id: friendId,
				amount: amount,
			});

			return { error: null, success: true };
		} catch (emailError) {
			console.error("Failed to send reminder email:", emailError);
			return { error: "Failed to send email", success: false };
		}
	});

// Get reminder history for current user
export const getReminderHistory = createServerFn({ method: "GET" })
	.validator((data: { friendId?: string }) => data)
	.handler(async ({ data: { friendId } }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		let query = supabase
			.from("payment_reminders")
			.select(
				`
				*,
				recipient:users!payment_reminders_recipient_id_fkey(id, display_name, username, avatar_url)
			`
			)
			.eq("sender_id", authUser.id)
			.order("created_at", { ascending: false })
			.limit(20);

		if (friendId) {
			query = query.eq("recipient_id", friendId);
		}

		const { data, error } = await query;

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data };
	});

// Check if reminder can be sent (not sent in last 24 hours)
export const canSendReminder = createServerFn({ method: "GET" })
	.validator((data: { friendId: string }) => data)
	.handler(async ({ data: { friendId } }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", canSend: false, lastSent: null };
		}

		const { data: recentReminder } = await supabase
			.from("payment_reminders")
			.select("created_at")
			.eq("sender_id", authUser.id)
			.eq("recipient_id", friendId)
			.order("created_at", { ascending: false })
			.limit(1)
			.maybeSingle();

		if (!recentReminder) {
			return { error: null, canSend: true, lastSent: null };
		}

		const lastSentTime = new Date(recentReminder.created_at).getTime();
		const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
		const canSend = lastSentTime < twentyFourHoursAgo;

		return {
			error: null,
			canSend,
			lastSent: recentReminder.created_at,
		};
	});
