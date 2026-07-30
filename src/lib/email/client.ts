import "server-only";

import { Resend } from "resend";

let client: Resend | null = null;

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error("resend_not_configured");
  client ??= new Resend(apiKey);
  return client;
}

