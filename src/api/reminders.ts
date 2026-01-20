import { createServerFn } from "@tanstack/react-start";
import { Resend } from "resend";
import { getCurrentUser } from "../lib/auth";
import { supabaseAdmin } from "../lib/supabase";

// Initialize Resend client
const getResendClient = () => {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		throw new Error("RESEND_API_KEY is not configured");
	}
	return new Resend(apiKey);
};

// Common email sending function that checks user email preferences
export async function sendEmail({
	recipientId,
	subject,
	html,
}: {
	recipientId: string;
	subject: string;
	html: string;
}): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
	// Get recipient's email and preferences
	const { data: recipient, error: recipientError } = await supabaseAdmin
		.from("users")
		.select("email, display_name, email_notifications_enabled")
		.eq("id", recipientId)
		.single();

	if (recipientError || !recipient) {
		console.error("Could not fetch recipient details:", recipientError);
		return { success: false, error: "Could not fetch recipient details" };
	}

	// Check if user has opted out of emails
	if (!recipient.email_notifications_enabled) {
		console.log(
			`Skipping email to ${recipientId} - user has opted out of notifications`,
		);
		return { success: true, skipped: true };
	}

	try {
		const resend = getResendClient();
		const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@i-bet-u.com";
		const appUrl = process.env.APP_URL || "https://i-bet-u.com";

		// Add unsubscribe footer to all emails
		const htmlWithFooter = html.replace(
			"</body>",
			`<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
				<p style="font-size: 12px; color: #9ca3af;">
					Don't want to receive these emails? <a href="${appUrl}/settings" style="color: #f97316; text-decoration: underline;">Update your preferences</a>
				</p>
			</div>
			</body>`,
		);

		await resend.emails.send({
			from: `iBetU <${fromEmail}>`,
			to: recipient.email,
			subject,
			html: htmlWithFooter,
		});

		return { success: true };
	} catch (emailError) {
		console.error("Failed to send email:", {
			error: emailError,
			message:
				emailError instanceof Error ? emailError.message : String(emailError),
			recipientId,
			hasApiKey: !!process.env.RESEND_API_KEY,
		});
		return { success: false, error: "Failed to send email" };
	}
}

// Send a payment reminder to a friend who owes money
export const sendPaymentReminder = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { friendId: string; amount: number; friendName: string }) => data,
	)
	.handler(async ({ data: { friendId, amount, friendName: _friendName } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", success: false };
		}

		const userId = currentUser.user.id;
		const senderUser = currentUser.user;

		// Get friend's display name
		const { data: friend, error: friendError } = await supabaseAdmin
			.from("users")
			.select("display_name")
			.eq("id", friendId)
			.single();

		if (friendError || !friend) {
			return { error: "Could not fetch friend details", success: false };
		}

		// Check if a reminder was sent recently (within last 24 hours)
		const { data: recentReminder } = await supabaseAdmin
			.from("payment_reminders")
			.select("id, created_at")
			.eq("sender_id", userId)
			.eq("recipient_id", friendId)
			.gte(
				"created_at",
				new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
			)
			.maybeSingle();

		if (recentReminder) {
			return {
				error:
					"You already sent a reminder to this friend in the last 24 hours",
				success: false,
			};
		}

		const appUrl = process.env.APP_URL || "https://i-bet-u.com";

		// Send the email using the common sendEmail function
		const emailResult = await sendEmail({
			recipientId: friendId,
			subject: `${senderUser.display_name} sent you a payment reminder`,
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
							<strong>${senderUser.display_name}</strong> (@${senderUser.username}) is reminding you that you owe them:
						</p>
						<div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
							<span style="font-size: 36px; font-weight: bold; color: #b45309;">$${amount.toFixed(2)}</span>
						</div>
						<p style="font-size: 14px; color: #6b7280;">
							This amount is based on completed bets between you two. Time to settle up!
						</p>
						<div style="text-align: center; margin-top: 30px;">
							<a href="${appUrl}/friends"
							   style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
								View on iBetU
							</a>
						</div>
					</div>
				</body>
				</html>
			`,
		});

		if (!emailResult.success) {
			return {
				error: emailResult.error || "Failed to send email",
				success: false,
			};
		}

		// Record the reminder (even if email was skipped due to opt-out, we still track the reminder attempt)
		await supabaseAdmin.from("payment_reminders").insert({
			sender_id: userId,
			recipient_id: friendId,
			amount: amount,
		});

		return { error: null, success: true };
	});

// Get reminder history for current user
export const getReminderHistory = createServerFn({ method: "GET" })
	.inputValidator((data: { friendId?: string }) => data)
	.handler(async ({ data: { friendId } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", data: null };
		}

		const userId = currentUser.user.id;

		let query = supabaseAdmin
			.from("payment_reminders")
			.select(
				`
				*,
				recipient:users!payment_reminders_recipient_id_fkey(id, display_name, username, avatar_url)
			`,
			)
			.eq("sender_id", userId)
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

// Send winner confirmation email when one participant declares a winner
export async function sendWinnerConfirmationEmail({
	recipientId,
	recipientName,
	declarerName,
	winnerName,
	betTitle,
	betAmount,
	betId,
}: {
	recipientId: string;
	recipientName: string;
	declarerName: string;
	winnerName: string;
	betTitle: string;
	betAmount: number;
	betId: string;
}): Promise<{ success: boolean; error?: string }> {
	const appUrl = process.env.APP_URL || "https://i-bet-u.com";

	return sendEmail({
		recipientId,
		subject: `${declarerName} declared a winner - Please confirm!`,
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
					<h2 style="color: #1f2937; margin-top: 0;">Hey ${recipientName}!</h2>
					<p style="font-size: 16px; color: #4b5563;">
						<strong>${declarerName}</strong> has declared a winner for your bet and needs your confirmation.
					</p>
					<div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
						<p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Bet:</p>
						<p style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">${betTitle}</p>
					</div>
					<div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
						<p style="margin: 0 0 5px 0; font-size: 14px; color: #92400e;">Declared Winner:</p>
						<span style="font-size: 24px; font-weight: bold; color: #b45309;">${winnerName}</span>
						<p style="margin: 10px 0 0 0; font-size: 14px; color: #92400e;">Amount: $${betAmount.toFixed(2)}</p>
					</div>
					<p style="font-size: 14px; color: #6b7280;">
						Please review and confirm this result. The bet will be marked as completed once both parties agree on the winner.
					</p>
					<div style="text-align: center; margin-top: 30px;">
						<a href="${appUrl}/bets/${betId}"
						   style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
							Review & Confirm
						</a>
					</div>
				</div>
			</body>
			</html>
		`,
	});
}

// Send bet invitation email when a bet is created
export async function sendBetInvitationEmail({
	recipientId,
	recipientName,
	creatorName,
	creatorUsername,
	betTitle,
	betDescription,
	betAmount,
	betDeadline,
	betId,
}: {
	recipientId: string;
	recipientName: string;
	creatorName: string;
	creatorUsername: string;
	betTitle: string;
	betDescription: string;
	betAmount: number;
	betDeadline: string;
	betId: string;
}): Promise<{ success: boolean; error?: string }> {
	const appUrl = process.env.APP_URL || "https://i-bet-u.com";
	const formattedDeadline = new Date(betDeadline).toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	return sendEmail({
		recipientId,
		subject: `${creatorName} challenged you to a bet!`,
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
					<h2 style="color: #1f2937; margin-top: 0;">Hey ${recipientName}!</h2>
					<p style="font-size: 16px; color: #4b5563;">
						<strong>${creatorName}</strong> (@${creatorUsername}) has challenged you to a bet!
					</p>
					<div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
						<p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">The Bet:</p>
						<p style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">${betTitle}</p>
						${betDescription ? `<p style="margin: 10px 0 0 0; font-size: 14px; color: #4b5563;">${betDescription}</p>` : ""}
					</div>
					<div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
						<p style="margin: 0 0 5px 0; font-size: 14px; color: #92400e;">Amount at Stake:</p>
						<span style="font-size: 36px; font-weight: bold; color: #b45309;">$${betAmount.toFixed(2)}</span>
						<p style="margin: 10px 0 0 0; font-size: 14px; color: #92400e;">Deadline: ${formattedDeadline}</p>
					</div>
					<p style="font-size: 14px; color: #6b7280;">
						Think you can win? Accept the challenge and prove it!
					</p>
					<div style="text-align: center; margin-top: 30px;">
						<a href="${appUrl}/bets/${betId}"
						   style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
							View & Accept Bet
						</a>
					</div>
				</div>
			</body>
			</html>
		`,
	});
}

// Send bet accepted email to the creator when opponent accepts
export async function sendBetAcceptedEmail({
	recipientId,
	recipientName,
	acceptorName,
	acceptorUsername,
	betTitle,
	betAmount,
	betDeadline,
	betId,
}: {
	recipientId: string;
	recipientName: string;
	acceptorName: string;
	acceptorUsername: string;
	betTitle: string;
	betAmount: number;
	betDeadline: string;
	betId: string;
}): Promise<{ success: boolean; error?: string }> {
	const appUrl = process.env.APP_URL || "https://i-bet-u.com";
	const formattedDeadline = new Date(betDeadline).toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	return sendEmail({
		recipientId,
		subject: `${acceptorName} accepted your bet!`,
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
					<h2 style="color: #1f2937; margin-top: 0;">Game On, ${recipientName}!</h2>
					<p style="font-size: 16px; color: #4b5563;">
						<strong>${acceptorName}</strong> (@${acceptorUsername}) has accepted your bet challenge!
					</p>
					<div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
						<p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">The Bet:</p>
						<p style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">${betTitle}</p>
					</div>
					<div style="background: #dcfce7; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
						<p style="margin: 0 0 5px 0; font-size: 14px; color: #166534;">Bet is now ACTIVE!</p>
						<span style="font-size: 36px; font-weight: bold; color: #15803d;">$${betAmount.toFixed(2)}</span>
						<p style="margin: 10px 0 0 0; font-size: 14px; color: #166534;">Deadline: ${formattedDeadline}</p>
					</div>
					<p style="font-size: 14px; color: #6b7280;">
						The bet is now active. May the best person win!
					</p>
					<div style="text-align: center; margin-top: 30px;">
						<a href="${appUrl}/bets/${betId}"
						   style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
							View Bet Details
						</a>
					</div>
				</div>
			</body>
			</html>
		`,
	});
}

// Send comment notification email when someone comments on a bet
export async function sendCommentNotificationEmail({
	recipientId,
	recipientName,
	commenterName,
	betTitle,
	commentContent,
	betId,
}: {
	recipientId: string;
	recipientName: string;
	commenterName: string;
	betTitle: string;
	commentContent: string;
	betId: string;
}): Promise<{ success: boolean; error?: string }> {
	const appUrl = process.env.APP_URL || "https://i-bet-u.com";

	// Truncate comment if too long for email preview
	const truncatedComment =
		commentContent.length > 200
			? `${commentContent.substring(0, 200)}...`
			: commentContent;

	return sendEmail({
		recipientId,
		subject: `${commenterName} commented on your bet`,
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
					<h2 style="color: #1f2937; margin-top: 0;">Hey ${recipientName}!</h2>
					<p style="font-size: 16px; color: #4b5563;">
						<strong>${commenterName}</strong> commented on your bet:
					</p>
					<div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
						<p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Bet:</p>
						<p style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">${betTitle}</p>
					</div>
					<div style="background: #f9fafb; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">
						<p style="margin: 0; font-size: 14px; color: #4b5563; font-style: italic;">"${truncatedComment}"</p>
					</div>
					<div style="text-align: center; margin-top: 30px;">
						<a href="${appUrl}/bets/${betId}"
						   style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
							View Bet & Reply
						</a>
					</div>
				</div>
			</body>
			</html>
		`,
	});
}

// Check if reminder can be sent (not sent in last 24 hours)
export const canSendReminder = createServerFn({ method: "GET" })
	.inputValidator((data: { friendId: string }) => data)
	.handler(async ({ data: { friendId } }) => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return { error: "Not authenticated", canSend: false, lastSent: null };
		}

		const userId = currentUser.user.id;

		const { data: recentReminder } = await supabaseAdmin
			.from("payment_reminders")
			.select("created_at")
			.eq("sender_id", userId)
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
