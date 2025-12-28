import type { SkillDefinition, SkillDecision } from "./types";

/**
 * Keywords for detecting commit message generation intent
 */
const COMMIT_KEYWORDS = [/commit message/i, /commit msg/i, /git commit/i];

/**
 * English keywords that indicate modification intent
 * These should NOT trigger commit_message skill, but should generate shell commands instead
 */
const COMMIT_MODIFY_KEYWORDS = [
  /amend.*commit/i,
  /change.*commit message/i,
  /edit.*commit message/i,
  /rewrite.*commit/i,
  /modify.*commit message/i,
  /update.*commit message/i,
  /fix.*commit message/i,
  /correct.*commit message/i,
];

/**
 * Patterns for detecting modification intent in mixed-language inputs
 * Used as heuristics when router is unavailable
 */
const MODIFY_INTENT_PATTERNS = [
  /(?:last|previous|上一条|上一个|前一个|latest).*commit message/i,
  /(?:modify|change|edit|amend|修改|改变|编辑).*commit message/i,
  /commit message.*(?:last|previous|上一条|上一个|前一个|latest)/i,
  /commit message.*(?:modify|change|edit|amend|修改|改变|编辑)/i,
];

/**
 * Check if intent contains modification keywords
 */
function containsModifyIntent(intent: string): boolean {
  return COMMIT_MODIFY_KEYWORDS.some((pattern) => pattern.test(intent));
}

/**
 * Check if intent might indicate modification using pattern matching
 */
function mightBeModifyIntent(intent: string): boolean {
  return MODIFY_INTENT_PATTERNS.some((pattern) => pattern.test(intent));
}

/**
 * Commit message skill - generates commit messages from git diff
 */
export const commitMessageSkill: SkillDefinition = {
  name: "commit_message",
  description:
    "Inspect local git changes and craft a concise, conventional commit message that summarizes them.",
  keywords: COMMIT_KEYWORDS,
  detect: (intent: string): SkillDecision | null => {
    if (!intent.trim()) return null;

    // If the intent contains modification keywords, don't use this skill
    // Let shell_command handle it
    if (containsModifyIntent(intent) || mightBeModifyIntent(intent)) {
      return null;
    }

    const matchedPattern = COMMIT_KEYWORDS.find((pattern) =>
      pattern.test(intent)
    );
    if (!matchedPattern) return null;

    return {
      skill: "commit_message",
      reason: `Matched keyword "${matchedPattern}"`,
      confidence: 0.92,
      via: "heuristic",
    };
  },
};

/**
 * Check if intent indicates modification of existing commit message
 * Used by router to distinguish between generating new vs modifying existing
 */
export function isModifyCommitIntent(intent: string): boolean {
  return containsModifyIntent(intent) || mightBeModifyIntent(intent);
}

