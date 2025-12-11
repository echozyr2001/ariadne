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

const COMMIT_KEYWORDS = [
  /commit message/i,
  /commit msg/i,
  /git commit/i,
  /写.*commit/i,
  /提交信息/,
  /生成.*commit/,
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

export function detectSkillByKeyword(intent: string): SkillDecision | null {
  if (!intent.trim()) {
    return null;
  }

  for (const pattern of COMMIT_KEYWORDS) {
    if (pattern.test(intent)) {
      return {
        skill: "commit_message",
        reason: `Matched keyword "${pattern}"`,
        confidence: 0.92,
        via: "heuristic",
      };
    }
  }

  return null;
}

function buildRouterPrompt(intent: string): string {
  const skillDescriptions = Object.entries(SKILL_MANIFEST)
    .map(([name, description]) => `- ${name}: ${description}`)
    .join("\n");

  return `You are a routing controller for Ariadne CLI.
Decide which built-in skill best matches the user's request.
Available skills:
${skillDescriptions}

Rules:
1. Choose "commit_message" when the user wants help writing git commit messages or summaries of local changes.
2. Choose "shell_command" for everything else (default command generation behavior).
3. Respond with a compact JSON object: {"skill": "<name>", "confidence": 0-1, "reason": "<short explanation>"}.
4. Do not include code fences or extra prose.

User intent:
"""${intent}"""`;
}

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Router response did not contain JSON.");
  }
  return text.slice(start, end + 1);
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
          "You are a deterministic router that decides which skill to run. Follow the rules exactly.",
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

    const parsed = JSON.parse(extractJson(buffer));
    const selectedSkill: SkillName =
      parsed.skill === "commit_message" ? "commit_message" : "shell_command";

    return {
      skill: selectedSkill,
      reason: parsed.reason ?? "Router model selection",
      confidence:
        typeof parsed.confidence === "number" ? parsed.confidence : 0.6,
      via: "router",
    };
  } catch (error) {
    logDebug(
      `Skill router failed (${error instanceof Error ? error.message : error})`
    );
    return null;
  }
}

export async function determineSkill(
  intent: string,
  options: SkillRoutingOptions = {}
): Promise<SkillDecision> {
  const keywordDecision = detectSkillByKeyword(intent);
  if (keywordDecision) {
    return keywordDecision;
  }

  if (options.useRouterModel !== false) {
    const routerDecision = await evaluateWithRouter(intent);
    if (routerDecision) {
      return routerDecision;
    }
  }

  return {
    skill: "shell_command",
    reason: "Default fallback selection",
    confidence: 0.5,
    via: "fallback",
  };
}
