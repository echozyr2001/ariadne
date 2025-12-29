import type { SkillDefinition, SkillDecision } from "./types";

/**
 * Shell command skill - default skill for generating Unix commands
 */
export const shellCommandSkill: SkillDefinition = {
  name: "shell_command",
  description:
    "Generate exactly one safe Unix shell command that satisfies the request.",
  keywords: [], // No specific keywords - this is the default fallback
  routingRules: {
    when: "the user wants to MODIFY/EDIT/AMEND an existing commit message, or for all other requests (default command generation behavior)",
    examples: [
      "change the last commit message",
      "amend the last commit",
      "edit the previous commit message",
    ],
    indicators: ["modify", "change", "edit", "amend", "update"],
  },
  detect: (intent: string): SkillDecision | null => {
    // Shell command is the default, so we don't actively detect it
    // It will be used as fallback when other skills don't match
    return null;
  },
};
