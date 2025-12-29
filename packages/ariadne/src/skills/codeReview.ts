import type { SkillDefinition, SkillDecision } from "./types";

/**
 * Keywords for detecting code review intent
 */
const CODE_REVIEW_KEYWORDS = [
  /code review/i,
  /review code/i,
  /review my code/i,
  /review changes/i,
  /审查代码/i,
  /代码审查/i,
  /检查代码/i,
];

/**
 * Code review skill - reviews code changes and provides feedback
 */
export const codeReviewSkill: SkillDefinition = {
  name: "code_review",
  description:
    "Review local git changes and provide constructive feedback, potential issues, and improvement suggestions.",
  keywords: CODE_REVIEW_KEYWORDS,
  routingRules: {
    when: "the user wants to REVIEW/ANALYZE/CHECK their code changes for issues, improvements, or feedback",
    examples: [
      "review my code",
      "code review",
      "check my changes",
      "审查代码",
      "代码审查",
    ],
    indicators: ["review", "analyze", "check", "inspect", "examine"],
  },
  detect: (intent: string): SkillDecision | null => {
    if (!intent.trim()) return null;

    const matchedPattern = CODE_REVIEW_KEYWORDS.find((pattern) =>
      pattern.test(intent)
    );
    if (!matchedPattern) return null;

    return {
      skill: "code_review",
      reason: `Matched keyword "${matchedPattern}"`,
      confidence: 0.92,
      via: "heuristic",
    };
  },
};
