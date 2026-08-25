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
      // Image generation can legitimately exceed two minutes. A longer client
      // window avoids launching another paid attempt while the provider is
      // still producing the first result.
      timeout: 240_000,
    });
  }

  return client;
}
