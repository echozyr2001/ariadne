const DEFAULT_HIGH_MODEL = "claude-3-5-sonnet-20241022";
const DEFAULT_LOW_MODEL = "claude-3-5-haiku-20241022";

function normalize(input: string | undefined): string | undefined {
  const trimmed = input?.trim();
  return trimmed ? trimmed : undefined;
}

export function getHighTierModel(): string {
  return normalize(process.env.ARIADNE_MODEL_HIGH) ?? DEFAULT_HIGH_MODEL;
}

export function getLowTierModel(): string {
  return normalize(process.env.ARIADNE_MODEL_LOW) ?? DEFAULT_LOW_MODEL;
}
