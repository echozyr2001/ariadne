import { query } from "@anthropic-ai/claude-agent-sdk";
import { getLowTierModel } from "@/modelConfig";

export type SkillName = "shell_command" | "commit_message";

export interface SkillDecision {
  skill: SkillName;
  reason: string;
  confidence: number;
  via: "heuristic" | "router" | "fallback";
}

export interface SkillRoutingOptions {
  useRouterModel?: boolean;
}

const ROUTER_BUDGET = 0.002;

// Keywords for detecting commit message generation intent
const COMMIT_KEYWORDS = [/commit message/i, /commit msg/i, /git commit/i];

// English keywords that indicate modification intent
// These should NOT trigger commit_message skill, but should generate shell commands instead
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

// Patterns for detecting modification intent in mixed-language inputs
// Used as heuristics when router is unavailable
// Note: Non-English patterns are included as string literals in regex only
const MODIFY_INTENT_PATTERNS = [
  /(?:last|previous|上一条|上一个|前一个|latest).*commit message/i,
  /(?:modify|change|edit|amend|修改|改变|编辑).*commit message/i,
  /commit message.*(?:last|previous|上一条|上一个|前一个|latest)/i,
  /commit message.*(?:modify|change|edit|amend|修改|改变|编辑)/i,
];

const SKILL_MANIFEST: Record<SkillName, string> = {
  shell_command:
    "Generate exactly one safe Unix shell command that satisfies the request.",
  commit_message:
    "Inspect local git changes and craft a concise, conventional commit message that summarizes them.",
};

function logDebug(message: string) {
  if (process.env.ARIADNE_DEBUG) {
    console.debug(`[ariadne:skills] ${message}`);
  }
}

/**
 * Check if intent contains English modification keywords
 */
function containsModifyIntent(intent: string): boolean {
  return COMMIT_MODIFY_KEYWORDS.some((pattern) => pattern.test(intent));
}

/**
 * Check if intent might indicate modification using pattern matching
 * Used as fallback when router is unavailable
 */
function mightBeModifyIntent(intent: string): boolean {
  return MODIFY_INTENT_PATTERNS.some((pattern) => pattern.test(intent));
}

/**
 * Check if intent contains non-ASCII characters
 * Indicates need for semantic analysis via router
 */
function containsNonAscii(intent: string): boolean {
  return /[^\x00-\x7F]/.test(intent);
}

export function detectSkillByKeyword(intent: string): SkillDecision | null {
  if (!intent.trim()) {
    return null;
  }

  // If the intent contains modification keywords, don't use keyword matching
  // Let the router handle it for better semantic understanding
  if (containsModifyIntent(intent)) {
    return null;
  }

  // If the intent contains non-ASCII characters (e.g., Chinese), always use router
  // for semantic understanding, even if it contains "commit message" keywords
  // This avoids false positives like "我希望修改上一条commit message"
  if (containsNonAscii(intent)) {
    return null;
  }

  // For pure English inputs without modification intent, use keyword matching
  const matchedPattern = COMMIT_KEYWORDS.find((pattern) =>
    pattern.test(intent)
  );
  if (matchedPattern) {
    return {
      skill: "commit_message",
      reason: `Matched keyword "${matchedPattern}"`,
      confidence: 0.92,
      via: "heuristic",
    };
  }

  return null;
}

function buildRouterPrompt(intent: string): string {
  const skillDescriptions = Object.entries(SKILL_MANIFEST)
    .map(([name, description]) => `- ${name}: ${description}`)
    .join("\n");

  return `You are a routing controller for Ariadne CLI. Analyze the user's intent and determine which skill to use.

    Available skills:
    ${skillDescriptions}
    
    Analysis rules:
    1. Choose "commit_message" when the user wants to GENERATE/WRITE/CREATE a NEW commit message based on current git changes.
       - Understand semantic meaning regardless of language
       - Examples: "write a commit message", "generate commit message", "create a commit message"
       - Key semantic indicators: requests to "generate", "write", "create", "give me", "get" a commit message
    2. Choose "shell_command" when the user wants to MODIFY/EDIT/AMEND an existing commit message.
       - Understand semantic meaning regardless of language
       - Examples: "change the last commit message", "amend the last commit", "edit the previous commit message"
       - Key semantic indicators: requests to "modify", "change", "edit", "amend", "update" an existing commit message
    3. Choose "shell_command" for all other requests (default command generation behavior).
    
    CRITICAL: Perform semantic analysis of the user's intent. Understand the meaning regardless of the language used in the request (English, Chinese, Japanese, or any other language).
    
    You MUST respond with ONLY a valid JSON object in this exact format:
    {
      "skill": "commit_message" | "shell_command",
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

    const selectedSkill: SkillName =
      parsed.skill === "commit_message" ? "commit_message" : "shell_command";

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
  const hasCommitKeywords = COMMIT_KEYWORDS.some((pattern) =>
    pattern.test(intent)
  );
  const hasModifyKeywords = COMMIT_MODIFY_KEYWORDS.some((pattern) =>
    pattern.test(intent)
  );
  const mightBeModify = mightBeModifyIntent(intent);
  const hasNonAscii = containsNonAscii(intent);

  // If input contains modification keywords or patterns, choose shell_command
  // This includes both English keywords and common modification patterns
  if (hasModifyKeywords || mightBeModify) {
    logDebug(
      `Router failed, but detected modification intent (keywords: ${hasModifyKeywords}, patterns: ${mightBeModify}). Using shell_command fallback.`
    );
    return {
      skill: "shell_command",
      reason:
        "Fallback: detected modification intent (router unavailable for semantic verification)",
      confidence: mightBeModify ? 0.6 : 0.65, // Lower confidence when using pattern matching
      via: "fallback",
    };
  }

  // If input contains "commit message" keywords and no modification intent,
  // assume the user wants to generate a commit message
  if (hasCommitKeywords) {
    logDebug(
      `Router failed, but detected commit message keywords without modification intent. ${
        hasNonAscii
          ? "Using fallback decision for mixed-language input (less reliable without semantic analysis)."
          : "Using fallback decision for English input."
      }`
    );
    return {
      skill: "commit_message",
      reason: hasNonAscii
        ? "Fallback: detected commit message keywords in mixed-language input (router unavailable for semantic verification)"
        : "Fallback: detected commit message keywords (router unavailable for semantic verification)",
      confidence: hasNonAscii ? 0.6 : 0.65,
      via: "fallback",
    };
  }

  // Final fallback: default to shell_command
  return {
    skill: "shell_command",
    reason: "Default fallback selection",
    confidence: 0.5,
    via: "fallback",
  };
}
