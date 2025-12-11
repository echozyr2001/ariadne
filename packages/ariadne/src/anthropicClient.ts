import { Anthropic } from "@ariadne/anthropic-sdk-light";

let cachedClient: Anthropic | null = null;

function assertApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is not set. " +
        "Please export it before running Ariadne."
    );
  }
  return apiKey;
}

export function getAnthropicClient(): Anthropic {
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey: assertApiKey() });
  }
  return cachedClient;
}
