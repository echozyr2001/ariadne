/**
 * Core types and interfaces for the skill system
 */

export type SkillName = "shell_command" | "commit_message" | "code_review";

export interface SkillDecision {
  skill: SkillName;
  reason: string;
  confidence: number;
  via: "heuristic" | "router" | "fallback";
}

export interface SkillRoutingOptions {
  useRouterModel?: boolean;
}

/**
 * Routing rule description for router prompt generation
 */
export interface RoutingRule {
  /** When to choose this skill (semantic description) */
  when: string;
  /** Example intents that should trigger this skill */
  examples?: string[];
  /** Key semantic indicators/keywords to look for */
  indicators?: string[];
}

/**
 * Skill definition interface
 * Each skill should export an object conforming to this interface
 */
export interface SkillDefinition {
  /** Unique identifier for the skill */
  name: SkillName;
  /** Human-readable description for routing and help text */
  description: string;
  /** Keywords/patterns to detect this skill (for heuristic matching) */
  keywords: RegExp[];
  /**
   * Optional routing rules for router prompt generation
   * Used to dynamically build router prompts instead of hardcoding
   */
  routingRules?: RoutingRule;
  /**
   * Optional function to detect if this skill should be used based on intent
   * Returns a decision if matched, null otherwise
   */
  detect?: (intent: string) => SkillDecision | null;
}
