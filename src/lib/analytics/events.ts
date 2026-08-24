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
  | "generation_started"
  | "thumbnail_variation_requested"
  | "thumbnail_concepts_requested"
  | "first_generation_completed"
  | "first_edit_completed"
  | "tool_opened"
  | "tool_completed"
  | "pricing_viewed"
  | "seo_landing_viewed"
  | "seo_cta_clicked"
  | "checkout_started"
  | "subscription_activated"
  | "support_request_created"
  | "brand_style_viewed"
  | "brand_style_creation_started"
  | "brand_style_references_uploaded"
  | "brand_style_analysis_completed"
  | "brand_style_created"
  | "brand_style_selected"
  | "brand_style_generation_completed"
  | "brand_style_limit_reached"
  | "brand_style_upgrade_clicked"
  | "brand_style_deleted";

type SafeProperties = Partial<{
  content_type: string;
  platform: string;
  style: string;
  plan: string;
  tool: string;
  landing: string;
  status: string;
  source: string;
  duration_bucket: string;
  variant: string;
  credit_cost: number;
  reference_count: number;
}>;

export function trackConversion(
  event: ConversionEvent,
  properties?: SafeProperties,
) {
  if (process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED !== "true") return;
  track(event, properties);
}
