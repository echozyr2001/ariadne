/**
 * Skills module - exports all skill definitions and routing logic
 */

export * from "./types";
export { shellCommandSkill } from "./shellCommand";
export { commitMessageSkill, isModifyCommitIntent } from "./commitMessage";
export { codeReviewSkill } from "./codeReview";

// Export all skills as an array for easy iteration
import { shellCommandSkill } from "./shellCommand";
import { commitMessageSkill } from "./commitMessage";
import { codeReviewSkill } from "./codeReview";
import type { SkillDefinition } from "./types";

export const allSkills: SkillDefinition[] = [
  codeReviewSkill, // Check more specific skills first
  commitMessageSkill,
  shellCommandSkill, // Default fallback
];

// Helper to get all skill names dynamically
export const getAllSkillNames = (): string[] =>
  allSkills.map((skill) => skill.name);
