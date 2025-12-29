import { query } from "@anthropic-ai/claude-agent-sdk";
import { getLowTierModel } from "@/modelConfig";
import {
  allSkills,
  isModifyCommitIntent,
  getAllSkillNames,
} from "./skills/index";
import type {
  SkillName,
  SkillDecision,
  SkillRoutingOptions,
} from "./skills/types";

const ROUTER_BUDGET = 0.002;

function logDebug(message: string) {
  if (process.env.ARIADNE_DEBUG) {
    console.debug(`[ariadne:skills] ${message}`);
  }
}

/**
 * Check if intent contains non-ASCII characters
 * Indicates need for semantic analysis via router
 */
function containsNonAscii(intent: string): boolean {
  return /[^\x00-\x7F]/.test(intent);
}

/**
 * Detect skill by keyword matching using skill definitions
 */
export function detectSkillByKeyword(intent: string): SkillDecision | null {
  if (!intent.trim()) {
    return null;
  }

  // If the intent contains modification keywords, don't use keyword matching
  // Let the router handle it for better semantic understanding
  if (isModifyCommitIntent(intent)) {
    return null;
  }

  // If the intent contains non-ASCII characters (e.g., Chinese), always use router
  // for semantic understanding, even if it contains keywords
  // This avoids false positives like "我希望修改上一条commit message"
  if (containsNonAscii(intent)) {
    return null;
  }

  // For pure English inputs without modification intent, use keyword matching
  // Check skills in order (more specific skills first)
  for (const skill of allSkills) {
    if (skill.detect) {
      const decision = skill.detect(intent);
      if (decision) {
        return decision;
      }
    }
  }

  return null;
}

/**
 * Build router prompt using skill definitions
 * Dynamically generates routing rules from skill definitions instead of hardcoding
 */
function buildRouterPrompt(intent: string): string {
  const skillDescriptions = allSkills
    .map((skill) => `- ${skill.name}: ${skill.description}`)
    .join("\n");
  const skillNamesList = getAllSkillNames()
    .map((name) => `"${name}"`)
    .join(" | ");

  // Dynamically build routing rules from skill definitions
  const skillsWithRules = allSkills.filter((skill) => skill.routingRules);
  const routingRules = skillsWithRules
    .map((skill, index) => {
      const rule = skill.routingRules!;
      const ruleNumber = index + 1;
      let ruleText = `${ruleNumber}. Choose "${skill.name}" when ${rule.when}.\n       - Understand semantic meaning regardless of language`;

      if (rule.examples && rule.examples.length > 0) {
        ruleText += `\n       - Examples: ${rule.examples
          .map((ex) => `"${ex}"`)
          .join(", ")}`;
      }

      if (rule.indicators && rule.indicators.length > 0) {
        ruleText += `\n       - Key semantic indicators: ${rule.indicators.join(
          ", "
        )}`;
      }

      return ruleText;
    })
    .join("\n    ");

  return `You are a routing controller for Ariadne CLI. Analyze the user's intent and determine which skill to use.

    Available skills:
    ${skillDescriptions}
    
    Analysis rules:
    ${routingRules}
    
    CRITICAL: Perform semantic analysis of the user's intent. Understand the meaning regardless of the language used in the request (English, Chinese, Japanese, or any other language).
    
    You MUST respond with ONLY a valid JSON object in this exact format:
    {
      "skill": ${skillNamesList},
      "confidence": 0.0-1.0,
      "reason": "brief explanation of your decision"
    }
    
    Do NOT include:
    - Code fences (no \`\`\`json or \`\`\`)
    - Markdown formatting
    - Any text before or after the JSON
    - Comments or explanations outside the JSON
    
    Analyze the user's intent and respond with JSON.
    
    User intent to analyze:
    """${intent}"""`;
}

/**
 * Extract and validate JSON from the router response
 * Handles cases where the model might include extra text or code fences
 */
function extractJson(text: string): string {
  // Remove code fences if present
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
  cleaned = cleaned.replace(/\s*```\s*$/, "");
  cleaned = cleaned.trim();

  // Find JSON object boundaries
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error(
      `Router response did not contain valid JSON. Received: ${text.substring(
        0,
        100
      )}`
    );
  }

  const jsonStr = cleaned.slice(start, end + 1);

  // Validate it's parseable JSON
  try {
    JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(
      `Router response contains invalid JSON: ${jsonStr.substring(0, 100)}`
    );
  }

  return jsonStr;
}

async function evaluateWithRouter(
  intent: string
): Promise<SkillDecision | null> {
  if (!intent.trim()) {
    return null;
  }

  try {
    const response = query({
      prompt: buildRouterPrompt(intent),
      options: {
        model: getLowTierModel(),
        maxBudgetUsd: ROUTER_BUDGET,
        settingSources: [],
        systemPrompt:
          "You are a deterministic router that analyzes user intent and outputs structured JSON. You MUST respond with ONLY valid JSON, no other text. Follow the routing rules exactly and perform semantic analysis of the user's request.",
      },
    });

    let buffer = "";
    for await (const message of response) {
      if (message.type === "assistant") {
        const assistantMessage = message as {
          content?:
            | string
            | Array<{
                type: string;
                text?: string;
              }>;
        };
        const content = assistantMessage.content;

        if (typeof content === "string") {
          buffer += content;
        } else if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === "text" && typeof block.text === "string") {
              buffer += block.text;
            }
          }
        }
      } else if (
        (message as { type: string }).type === "error" &&
        (message as { error?: { message?: string } }).error
      ) {
        const errorMessage =
          (message as { error?: { message?: string } }).error?.message ??
          "Unknown router error";
        throw new Error(errorMessage);
      }
    }

    // Check if we got any response
    if (!buffer || buffer.trim().length === 0) {
      throw new Error("Router returned empty response");
    }

    logDebug(`Router response: ${buffer.substring(0, 200)}`);

    const jsonStr = extractJson(buffer);
    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (!parsed.skill || typeof parsed.skill !== "string") {
      throw new Error("Router response missing or invalid 'skill' field");
    }

    // Validate skill name is one of the known skills
    const validSkillNames = getAllSkillNames();
    const selectedSkill: SkillName = validSkillNames.includes(parsed.skill)
      ? (parsed.skill as SkillName)
      : "shell_command";

    // Validate and normalize confidence (clamp to [0, 1])
    const confidence =
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.6;

    // Validate reason
    const reason =
      typeof parsed.reason === "string" && parsed.reason.trim()
        ? parsed.reason.trim()
        : "Router model selection";

    return {
      skill: selectedSkill,
      reason,
      confidence,
      via: "router",
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logDebug(`Skill router failed: ${errorMsg}`);

    // If router fails, we can't make a reliable decision
    // Return null to let determineSkill handle fallback
    return null;
  }
}

export async function determineSkill(
  intent: string,
  options: SkillRoutingOptions = {}
): Promise<SkillDecision> {
  const keywordDecision = detectSkillByKeyword(intent);

  // If we have a keyword match (pure English, high confidence), use it directly
  if (keywordDecision) {
    return keywordDecision;
  }

  // For mixed-language inputs or ambiguous cases, always try router first
  // This ensures semantic understanding for non-English languages
  if (options.useRouterModel !== false) {
    try {
      const routerDecision = await evaluateWithRouter(intent);
      if (routerDecision) {
        return routerDecision;
      }
    } catch (error) {
      logDebug(
        `Router evaluation failed: ${
          error instanceof Error ? error.message : error
        }`
      );
      // Continue to fallback logic below
    }
  }

  // Fallback: If router failed, use keyword-based heuristics
  // This is less reliable than semantic analysis but better than random guessing
  const hasNonAscii = containsNonAscii(intent);

  // If input contains modification keywords or patterns, choose shell_command
  if (isModifyCommitIntent(intent)) {
    logDebug(
      `Router failed, but detected modification intent. Using shell_command fallback.`
    );
    return {
      skill: "shell_command",
      reason:
        "Fallback: detected modification intent (router unavailable for semantic verification)",
      confidence: 0.65,
      via: "fallback",
    };
  }

  // Try to match skills using their keywords (fallback mode)
  for (const skill of allSkills) {
    if (skill.name === "shell_command") continue; // Skip default skill

    const hasKeywords = skill.keywords.some((pattern: RegExp) =>
      pattern.test(intent)
    );
    if (hasKeywords) {
      logDebug(
        `Router failed, but detected ${skill.name} keywords. ${
          hasNonAscii
            ? "Using fallback decision for mixed-language input (less reliable without semantic analysis)."
            : "Using fallback decision for English input."
        }`
      );
      return {
        skill: skill.name,
        reason: hasNonAscii
          ? `Fallback: detected ${skill.name} keywords in mixed-language input (router unavailable for semantic verification)`
          : `Fallback: detected ${skill.name} keywords (router unavailable for semantic verification)`,
        confidence: hasNonAscii ? 0.6 : 0.65,
        via: "fallback",
      };
    }
  }

  // Final fallback: default to shell_command
  return {
    skill: "shell_command",
    reason: "Default fallback selection",
    confidence: 0.5,
    via: "fallback",
  };
}

// Re-export types for backward compatibility
export type {
  SkillName,
  SkillDecision,
  SkillRoutingOptions,
} from "./skills/types";
