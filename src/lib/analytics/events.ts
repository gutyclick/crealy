"use client";

import { track } from "@vercel/analytics";

export type ConversionEvent =
  | "landing_primary_cta_clicked"
  | "signup_started"
  | "signup_completed"
  | "email_verified"
  | "onboarding_started"
  | "onboarding_completed"
  | "first_generation_started"
  | "first_generation_completed"
  | "first_edit_completed"
  | "tool_opened"
  | "tool_completed"
  | "pricing_viewed"
  | "checkout_started"
  | "subscription_activated"
  | "support_request_created";

type SafeProperties = Partial<{
  content_type: string;
  platform: string;
  style: string;
  plan: string;
  tool: string;
  status: string;
  source: string;
  duration_bucket: string;
}>;

export function trackConversion(
  event: ConversionEvent,
  properties?: SafeProperties,
) {
  if (process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED !== "true") return;
  track(event, properties);
}

