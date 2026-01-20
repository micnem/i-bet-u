# Playwright E2E Testing Integration Plan

This document outlines the plan for adding Playwright end-to-end testing to IBetU, including handling email OTP authentication.

## Overview

- **Testing Framework:** Playwright
- **Auth Strategy:** Email capture with Supabase Local (Inbucket)
- **Key Challenge:** Testing email + OTP based authentication

---

## Phase 1: Installation & Configuration

### 1. Install dependencies

```bash
pnpm add -D @playwright/test
npx playwright install
```

### 2. Create `playwright.config.ts`

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### 3. Add npm scripts

```json
{
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:debug": "playwright test --debug"
}
```

---

## Phase 2: Email Capture Setup

### Option A: Supabase Local (Inbucket) - Recommended for local dev

Supabase CLI includes Inbucket at `http://localhost:54324` when running `supabase start`.

### Option B: Mailpit (Docker) - For CI/standalone

```yaml
# docker-compose.e2e.yml
services:
  mailpit:
    image: axllent/mailpit
    ports:
      - "8025:8025"  # Web UI
      - "1025:1025"  # SMTP
```

Configure Supabase/Resend to route test emails to Mailpit's SMTP.

---

## Phase 3: Auth Helper Implementation

### `e2e/helpers/email.helper.ts`

```typescript
interface Email {
  id: string;
  to: { address: string }[];
  subject: string;
  text: string;
  html: string;
}

// For Supabase Local (Inbucket)
export async function getOtpFromInbucket(email: string): Promise<string> {
  const inbucketUrl = process.env.INBUCKET_URL || "http://localhost:54324";
  const mailbox = email.split("@")[0];

  // Wait for email to arrive
  let emails: Email[] = [];
  for (let i = 0; i < 10; i++) {
    const res = await fetch(`${inbucketUrl}/api/v1/mailbox/${mailbox}`);
    emails = await res.json();
    if (emails.length > 0) break;
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (emails.length === 0) {
    throw new Error(`No emails found for ${email}`);
  }

  // Get latest email content
  const latest = emails[emails.length - 1];
  const msgRes = await fetch(`${inbucketUrl}/api/v1/mailbox/${mailbox}/${latest.id}`);
  const message = await msgRes.json();

  // Extract 6-digit OTP
  const otpMatch = message.body.text.match(/\b\d{6}\b/);
  if (!otpMatch) {
    throw new Error("Could not find OTP in email");
  }

  return otpMatch[0];
}

// For Mailpit
export async function getOtpFromMailpit(email: string): Promise<string> {
  const mailpitUrl = process.env.MAILPIT_URL || "http://localhost:8025";

  // Wait and fetch emails
  let messages: any;
  for (let i = 0; i < 10; i++) {
    const res = await fetch(`${mailpitUrl}/api/v1/search?query=to:${email}`);
    messages = await res.json();
    if (messages.count > 0) break;
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (!messages?.count) {
    throw new Error(`No emails found for ${email}`);
  }

  const latestId = messages.messages[0].ID;
  const msgRes = await fetch(`${mailpitUrl}/api/v1/message/${latestId}`);
  const message = await msgRes.json();

  const otpMatch = message.Text.match(/\b\d{6}\b/);
  if (!otpMatch) {
    throw new Error("Could not find OTP in email");
  }

  return otpMatch[0];
}

export async function clearMailbox(email: string): Promise<void> {
  const inbucketUrl = process.env.INBUCKET_URL || "http://localhost:54324";
  const mailbox = email.split("@")[0];
  await fetch(`${inbucketUrl}/api/v1/mailbox/${mailbox}`, { method: "DELETE" });
}
```

---

## Phase 4: Auth Fixture

### `e2e/fixtures/auth.fixture.ts`

```typescript
import { test as base, expect, Page } from "@playwright/test";
import { getOtpFromInbucket, clearMailbox } from "../helpers/email.helper";

// Generate unique test email
export function getTestEmail() {
  return `test-${Date.now()}@inbucket.local`;
}

export async function loginWithOtp(page: Page, email: string) {
  // Clear any existing emails
  await clearMailbox(email);

  // Request OTP
  await page.goto("/auth/login");
  await page.getByRole("textbox", { name: /email/i }).fill(email);
  await page.getByRole("button", { name: /send|continue/i }).click();

  // Wait for OTP input to appear
  await expect(page.getByText(/code|verify/i)).toBeVisible();

  // Fetch OTP from email
  const otp = await getOtpFromInbucket(email);

  // Enter OTP
  await page.getByRole("textbox", { name: /code|otp/i }).fill(otp);
  await page.getByRole("button", { name: /verify|submit/i }).click();

  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/dashboard/);
}

// Fixture that provides authenticated page
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    const email = getTestEmail();
    await loginWithOtp(page, email);
    await use(page);
  },
});

export { expect } from "@playwright/test";
```

---

## Phase 5: Test Files

### `e2e/tests/smoke.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test("landing page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/IBetU/i);
});

test("login page loads", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
});
```

### `e2e/tests/auth.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { getOtpFromInbucket, clearMailbox } from "../helpers/email.helper";

test.describe("Authentication", () => {
  test("user can login with email OTP", async ({ page }) => {
    const email = `login-test-${Date.now()}@inbucket.local`;
    await clearMailbox(email);

    // Request OTP
    await page.goto("/auth/login");
    await page.getByRole("textbox", { name: /email/i }).fill(email);
    await page.getByRole("button", { name: /send|continue/i }).click();

    // Verify OTP input appears
    await expect(page.getByText(/code|verify/i)).toBeVisible();

    // Get OTP from Inbucket
    const otp = await getOtpFromInbucket(email);
    expect(otp).toMatch(/^\d{6}$/);

    // Enter OTP and verify
    await page.getByRole("textbox").last().fill(otp);
    await page.getByRole("button", { name: /verify|submit/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
  });

  test("user can signup with email OTP", async ({ page }) => {
    const email = `signup-test-${Date.now()}@inbucket.local`;
    await clearMailbox(email);

    await page.goto("/auth/signup");
    await page.getByRole("textbox", { name: /email/i }).fill(email);
    await page.getByRole("button", { name: /send|continue/i }).click();

    const otp = await getOtpFromInbucket(email);
    await page.getByRole("textbox").last().fill(otp);
    await page.getByRole("button", { name: /verify|submit/i }).click();

    await expect(page).toHaveURL(/dashboard|profile/);
  });

  test("shows error for invalid OTP", async ({ page }) => {
    const email = `invalid-otp-${Date.now()}@inbucket.local`;

    await page.goto("/auth/login");
    await page.getByRole("textbox", { name: /email/i }).fill(email);
    await page.getByRole("button", { name: /send|continue/i }).click();

    // Enter wrong OTP
    await page.getByRole("textbox").last().fill("000000");
    await page.getByRole("button", { name: /verify|submit/i }).click();

    // Should show error
    await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible();
  });
});
```

### `e2e/tests/bets.spec.ts`

```typescript
import { test, expect } from "../fixtures/auth.fixture";

test.describe("Bets", () => {
  test("authenticated user can access create bet page", async ({ authedPage }) => {
    await authedPage.goto("/bets/create");
    await expect(authedPage.getByText(/create.*bet/i)).toBeVisible();
  });

  test("authenticated user can see dashboard", async ({ authedPage }) => {
    await authedPage.goto("/dashboard");
    await expect(authedPage).toHaveURL(/dashboard/);
  });
});
```

---

## Phase 6: Directory Structure

```
e2e/
├── fixtures/
│   └── auth.fixture.ts      # Auth helpers & fixtures
├── helpers/
│   └── email.helper.ts      # Inbucket/Mailpit API helpers
├── tests/
│   ├── smoke.spec.ts        # Basic page load tests
│   ├── auth.spec.ts         # Login/signup flows
│   └── bets.spec.ts         # Bet features (uses auth fixture)
```

---

## Phase 7: CI Setup

### `.github/workflows/e2e.yml`

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install
      - run: npx playwright install --with-deps chromium

      # Start Supabase local (includes Inbucket)
      - run: supabase start

      - run: pnpm test:e2e
        env:
          INBUCKET_URL: http://localhost:54324
          VITE_SUPABASE_URL: http://localhost:54321
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Implementation Checklist

- [ ] Install `@playwright/test`
- [ ] Create `playwright.config.ts`
- [ ] Create `e2e/helpers/email.helper.ts`
- [ ] Create `e2e/fixtures/auth.fixture.ts`
- [ ] Create `e2e/tests/smoke.spec.ts`
- [ ] Create `e2e/tests/auth.spec.ts`
- [ ] Create `e2e/tests/bets.spec.ts`
- [ ] Add npm scripts to `package.json`
- [ ] Update `biome.json` to handle e2e folder
- [ ] Create `.github/workflows/e2e.yml`

---

## Running Tests

### Local Development

```bash
# Start Supabase local (includes Inbucket for email capture)
supabase start

# Run all e2e tests
pnpm test:e2e

# Run with UI mode (interactive)
pnpm test:e2e:ui

# Run in debug mode
pnpm test:e2e:debug
```

### Viewing Captured Emails

When running Supabase locally, Inbucket UI is available at:
- http://localhost:54324

This shows all emails sent during testing, useful for debugging OTP issues.
