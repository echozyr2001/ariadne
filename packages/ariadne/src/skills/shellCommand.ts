import type { SkillDefinition, SkillDecision } from "./types";

/**
 * Shell command skill - default skill for generating Unix commands
 */
export const shellCommandSkill: SkillDefinition = {
  name: "shell_command",
  description:
    "Generate exactly one safe Unix shell command that satisfies the request.",
  keywords: [], // No specific keywords - this is the default fallback
  detect: (intent: string): SkillDecision | null => {
    // Shell command is the default, so we don't actively detect it
    // It will be used as fallback when other skills don't match
    return null;
  },
};
