import { getAnthropicClient } from "@/anthropicClient";

const FALLBACK_HIGH_MODEL = "claude-sonnet-4-6";
const FALLBACK_LOW_MODEL = "claude-haiku-4-5";

function normalize(input: string | undefined): string | undefined {
  const trimmed = input?.trim();
  return trimmed ? trimmed : undefined;
}

type ModelTier = "high" | "low";

// Simple in-memory cache: resolved once per process lifetime
const resolvedModels: Partial<Record<ModelTier, string>> = {};

/**
 * Fetches the latest model for a given tier from the Anthropic models API.
 * Picks the most recently created model whose ID matches the tier pattern.
 * Falls back to the hardcoded default if the API call fails.
 */
async function resolveLatestModel(
  tier: ModelTier,
  fallback: string
): Promise<string> {
  if (resolvedModels[tier]) return resolvedModels[tier]!;

  const pattern = tier === "high" ? /claude.*sonnet/i : /claude.*haiku/i;

  try {
    const client = getAnthropicClient();
    // @ts-ignore — models.list() exists at runtime; may not be typed in older SDK versions
    const page = await client.models.list({ limit: 100 });
    const models: Array<{ id: string; created_at: string }> = page.data ?? [];

    const matched = models
      .filter((m) => pattern.test(m.id))
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    const chosen = matched[0]?.id ?? fallback;
    resolvedModels[tier] = chosen;
    return chosen;
  } catch {
    resolvedModels[tier] = fallback;
    return fallback;
  }
}

export async function getHighTierModel(): Promise<string> {
  return normalize(process.env.ARIADNE_MODEL_HIGH) ?? resolveLatestModel("high", FALLBACK_HIGH_MODEL);
}

export async function getLowTierModel(): Promise<string> {
  return normalize(process.env.ARIADNE_MODEL_LOW) ?? resolveLatestModel("low", FALLBACK_LOW_MODEL);
}
