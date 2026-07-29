import "server-only";

import OpenAI from "openai";

import { getGenerationServerEnv } from "@/lib/env/server";

let client: OpenAI | undefined;

export function getOpenAIClient() {
  if (!client) {
    const { apiKey } = getGenerationServerEnv();
    client = new OpenAI({
      apiKey,
      maxRetries: 0,
      timeout: 120_000,
    });
  }

  return client;
}
