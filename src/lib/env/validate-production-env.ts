type ValidationResult = {
  valid: boolean;
  missing: string[];
  invalid: string[];
  warnings: string[];
};

function enabled(name: string) {
  return process.env[name]?.trim().toLowerCase() === "true";
}

export function validateProductionEnv(): ValidationResult {
  const missing: string[] = [];
  const invalid: string[] = [];
  const warnings: string[] = [];
  const required = [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SECRET_KEY",
    "CRON_SECRET",
    "IP_HASH_SALT",
  ];
  for (const name of required) {
    if (!process.env[name]?.trim()) missing.push(name);
  }

  for (const name of ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_SUPABASE_URL"]) {
    const value = process.env[name]?.trim();
    if (!value) continue;
    try {
      if (new URL(value).protocol !== "https:") invalid.push(name);
    } catch {
      invalid.push(name);
    }
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const canonicalHost = process.env.NEXT_PUBLIC_CANONICAL_HOST?.trim();
  if (siteUrl && canonicalHost) {
    try {
      if (new URL(siteUrl).hostname !== canonicalHost) {
        invalid.push("NEXT_PUBLIC_CANONICAL_HOST");
      }
    } catch {
      // NEXT_PUBLIC_SITE_URL is already reported above.
    }
  }

  if (enabled("OPENAI_GENERATION_ENABLED") && !process.env.OPENAI_API_KEY) {
    missing.push("OPENAI_API_KEY");
  }
  if (enabled("STRIPE_BILLING_ENABLED")) {
    for (const name of [
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "STRIPE_STARTER_MONTHLY_PRICE_ID",
      "STRIPE_CREATOR_MONTHLY_PRICE_ID",
      "STRIPE_PRO_MONTHLY_PRICE_ID",
    ]) {
      if (!process.env[name]?.trim()) missing.push(name);
    }
    if (
      process.env.VERCEL_ENV === "preview" &&
      process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")
    ) {
      invalid.push("STRIPE_SECRET_KEY");
    }
    if (
      process.env.VERCEL_ENV === "production" &&
      process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")
    ) {
      invalid.push("STRIPE_SECRET_KEY");
    }
    for (const name of ["STRIPE_STARTER_MONTHLY_PRICE_ID", "STRIPE_CREATOR_MONTHLY_PRICE_ID", "STRIPE_PRO_MONTHLY_PRICE_ID"]) {
      const value = process.env[name]?.trim();
      if (value && !value.startsWith("price_")) invalid.push(name);
    }
  }
  if (enabled("TRANSACTIONAL_EMAILS_ENABLED")) {
    for (const name of [
      "RESEND_API_KEY",
      "EMAIL_FROM_ADDRESS",
      "EMAIL_REPLY_TO",
      "RESEND_WEBHOOK_SECRET",
    ]) {
      if (!process.env[name]?.trim()) missing.push(name);
    }
  }
  if (enabled("SUPPORT_FORM_ENABLED") && !process.env.SUPPORT_EMAIL_ADDRESS) {
    missing.push("SUPPORT_EMAIL_ADDRESS");
  }
  if (
    (process.env.OBJECT_STORAGE_PROVIDER || process.env.STORAGE_PROVIDER) ===
    "r2"
  ) {
    for (const name of [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
    ]) {
      if (!process.env[name]?.trim()) missing.push(name);
    }
  }
  if (!process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME?.trim()) {
    warnings.push("NEXT_PUBLIC_LEGAL_ENTITY_NAME");
  }
  if (!process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL?.trim()) {
    warnings.push("NEXT_PUBLIC_LEGAL_CONTACT_EMAIL");
  }
  if (
    process.env.NEXT_PUBLIC_LAUNCH_STAGE === "private_beta" &&
    process.env.REGISTRATIONS_ENABLED !== "false" &&
    process.env.INVITE_REQUIRED !== "true"
  ) {
    invalid.push("INVITE_REQUIRED");
  }

  return {
    valid: missing.length === 0 && invalid.length === 0,
    missing: [...new Set(missing)],
    invalid: [...new Set(invalid)],
    warnings,
  };
}
