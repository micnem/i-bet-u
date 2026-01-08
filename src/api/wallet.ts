import { createServerFn } from "@tanstack/react-start";
import { supabase, supabaseAdmin } from "../lib/supabase";
import type { TransactionInsert, PaymentMethodInsert } from "../lib/database.types";

// Get wallet balance
export const getWalletBalance = createServerFn({ method: "GET" }).handler(
	async () => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", balance: 0 };
		}

		const { data, error } = await supabase
			.from("users")
			.select("wallet_balance")
			.eq("id", authUser.id)
			.single();

		if (error) {
			return { error: error.message, balance: 0 };
		}

		return { error: null, balance: data.wallet_balance };
	}
);

// Get transaction history
export const getTransactions = createServerFn({ method: "GET" })
	.validator((data: { limit?: number; offset?: number }) => data)
	.handler(async ({ data: { limit = 50, offset = 0 } }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		const { data, error } = await supabase
			.from("transactions")
			.select(
				`
				*,
				bet:bets(id, title)
			`
			)
			.eq("user_id", authUser.id)
			.order("created_at", { ascending: false })
			.range(offset, offset + limit - 1);

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data };
	});

// Add funds to wallet (mock - in production would integrate with Stripe)
export const addFunds = createServerFn({ method: "POST" })
	.validator((data: { amount: number; paymentMethodId: string }) => data)
	.handler(async ({ data: { amount, paymentMethodId } }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		if (amount <= 0) {
			return { error: "Amount must be positive", data: null };
		}

		// Verify payment method belongs to user
		const { data: paymentMethod } = await supabase
			.from("payment_methods")
			.select("id")
			.eq("id", paymentMethodId)
			.eq("user_id", authUser.id)
			.single();

		if (!paymentMethod) {
			return { error: "Invalid payment method", data: null };
		}

		// In production: Process payment with Stripe here
		// For now, we'll just update the balance directly

		// Update balance
		const { data: user, error: updateError } = await supabase.rpc(
			"add_balance",
			{
				user_id: authUser.id,
				amount: amount,
			}
		);

		if (updateError) {
			// Fallback: direct update if RPC doesn't exist
			const { error: directError } = await supabase
				.from("users")
				.update({
					wallet_balance: supabase.rpc("increment_balance", { amount }),
				})
				.eq("id", authUser.id);

			if (directError) {
				return { error: directError.message, data: null };
			}
		}

		// Create transaction record
		const transaction: TransactionInsert = {
			user_id: authUser.id,
			type: "deposit",
			amount: amount,
			description: "Added funds to wallet",
		};

		const { data: txn, error: txnError } = await supabase
			.from("transactions")
			.insert(transaction)
			.select()
			.single();

		if (txnError) {
			return { error: txnError.message, data: null };
		}

		// Get updated balance
		const { data: updatedUser } = await supabase
			.from("users")
			.select("wallet_balance")
			.eq("id", authUser.id)
			.single();

		return {
			error: null,
			data: {
				transaction: txn,
				newBalance: updatedUser?.wallet_balance || 0,
			},
		};
	});

// Withdraw funds (mock - in production would integrate with Stripe)
export const withdrawFunds = createServerFn({ method: "POST" })
	.validator((data: { amount: number; paymentMethodId: string }) => data)
	.handler(async ({ data: { amount, paymentMethodId } }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		if (amount <= 0) {
			return { error: "Amount must be positive", data: null };
		}

		// Check current balance
		const { data: user } = await supabase
			.from("users")
			.select("wallet_balance")
			.eq("id", authUser.id)
			.single();

		if (!user || user.wallet_balance < amount) {
			return { error: "Insufficient balance", data: null };
		}

		// Verify payment method belongs to user
		const { data: paymentMethod } = await supabase
			.from("payment_methods")
			.select("id")
			.eq("id", paymentMethodId)
			.eq("user_id", authUser.id)
			.single();

		if (!paymentMethod) {
			return { error: "Invalid payment method", data: null };
		}

		// In production: Process withdrawal with Stripe here

		// Deduct balance
		const newBalance = user.wallet_balance - amount;
		const { error: updateError } = await supabase
			.from("users")
			.update({ wallet_balance: newBalance })
			.eq("id", authUser.id);

		if (updateError) {
			return { error: updateError.message, data: null };
		}

		// Create transaction record
		const transaction: TransactionInsert = {
			user_id: authUser.id,
			type: "withdrawal",
			amount: -amount,
			description: "Withdrew funds from wallet",
		};

		const { data: txn, error: txnError } = await supabase
			.from("transactions")
			.insert(transaction)
			.select()
			.single();

		if (txnError) {
			return { error: txnError.message, data: null };
		}

		return {
			error: null,
			data: {
				transaction: txn,
				newBalance: newBalance,
			},
		};
	});

// Get payment methods
export const getPaymentMethods = createServerFn({ method: "GET" }).handler(
	async () => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		const { data, error } = await supabase
			.from("payment_methods")
			.select("*")
			.eq("user_id", authUser.id)
			.order("is_default", { ascending: false })
			.order("created_at", { ascending: false });

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data };
	}
);

// Add payment method (mock - in production would use Stripe)
export const addPaymentMethod = createServerFn({ method: "POST" })
	.validator(
		(data: {
			type: "credit_card" | "debit_card";
			last4: string;
			brand: string;
			expiryMonth: number;
			expiryYear: number;
			setAsDefault?: boolean;
		}) => data
	)
	.handler(async ({ data }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		// In production: Create payment method with Stripe here
		// and store the stripe_payment_method_id

		// If setting as default, unset other defaults first
		if (data.setAsDefault) {
			await supabase
				.from("payment_methods")
				.update({ is_default: false })
				.eq("user_id", authUser.id);
		}

		// Check if this is the first payment method
		const { count } = await supabase
			.from("payment_methods")
			.select("*", { count: "exact", head: true })
			.eq("user_id", authUser.id);

		const isFirst = count === 0;

		const paymentMethod: PaymentMethodInsert = {
			user_id: authUser.id,
			type: data.type,
			last4: data.last4,
			brand: data.brand,
			expiry_month: data.expiryMonth,
			expiry_year: data.expiryYear,
			is_default: data.setAsDefault || isFirst,
		};

		const { data: pm, error } = await supabase
			.from("payment_methods")
			.insert(paymentMethod)
			.select()
			.single();

		if (error) {
			return { error: error.message, data: null };
		}

		return { error: null, data: pm };
	});

// Remove payment method
export const removePaymentMethod = createServerFn({ method: "POST" })
	.validator((data: { paymentMethodId: string }) => data)
	.handler(async ({ data: { paymentMethodId } }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", success: false };
		}

		// In production: Remove from Stripe as well

		const { error } = await supabase
			.from("payment_methods")
			.delete()
			.eq("id", paymentMethodId)
			.eq("user_id", authUser.id);

		if (error) {
			return { error: error.message, success: false };
		}

		return { error: null, success: true };
	});

// Set default payment method
export const setDefaultPaymentMethod = createServerFn({ method: "POST" })
	.validator((data: { paymentMethodId: string }) => data)
	.handler(async ({ data: { paymentMethodId } }) => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", success: false };
		}

		// Unset all defaults
		await supabase
			.from("payment_methods")
			.update({ is_default: false })
			.eq("user_id", authUser.id);

		// Set new default
		const { error } = await supabase
			.from("payment_methods")
			.update({ is_default: true })
			.eq("id", paymentMethodId)
			.eq("user_id", authUser.id);

		if (error) {
			return { error: error.message, success: false };
		}

		return { error: null, success: true };
	});

// Get wallet summary (balance + recent transactions)
export const getWalletSummary = createServerFn({ method: "GET" }).handler(
	async () => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (!authUser) {
			return { error: "Not authenticated", data: null };
		}

		// Get user with balance
		const { data: user } = await supabase
			.from("users")
			.select("wallet_balance")
			.eq("id", authUser.id)
			.single();

		// Get recent transactions
		const { data: transactions } = await supabase
			.from("transactions")
			.select("*")
			.eq("user_id", authUser.id)
			.order("created_at", { ascending: false })
			.limit(5);

		// Get payment methods
		const { data: paymentMethods } = await supabase
			.from("payment_methods")
			.select("*")
			.eq("user_id", authUser.id)
			.order("is_default", { ascending: false });

		// Calculate totals
		const { data: deposits } = await supabase
			.from("transactions")
			.select("amount")
			.eq("user_id", authUser.id)
			.eq("type", "deposit");

		const { data: withdrawals } = await supabase
			.from("transactions")
			.select("amount")
			.eq("user_id", authUser.id)
			.eq("type", "withdrawal");

		const totalDeposits =
			deposits?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
		const totalWithdrawals =
			withdrawals?.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;

		return {
			error: null,
			data: {
				balance: user?.wallet_balance || 0,
				recentTransactions: transactions || [],
				paymentMethods: paymentMethods || [],
				totalDeposits,
				totalWithdrawals,
			},
		};
	}
);
