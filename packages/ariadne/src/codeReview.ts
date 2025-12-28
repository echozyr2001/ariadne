import { getAnthropicClient } from "@/anthropicClient";
import { readRepositoryDiff } from "@/git";
import { getHighTierModel } from "@/modelConfig";

export interface CodeReviewResult {
  summary: string;
  issues: Array<{
    severity: "critical" | "warning" | "suggestion";
    category: string;
    description: string;
    location?: string;
  }>;
  suggestions: string[];
  positives: string[];
  diffSource: "staged" | "workspace";
  statSummary: string;
  statusSummary: string;
  truncated: boolean;
}

function normalizeText(content: string): string {
  return content.replace(/\r\n/g, "\n").trim();
}

function parseReviewResponse(text: string): CodeReviewResult {
  const normalized = normalizeText(text);
  
  // Try to parse structured JSON first
  try {
    // Look for JSON in the response
    const jsonMatch = normalized.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.summary || parsed.issues) {
        return {
          summary: parsed.summary || "Code review completed",
          issues: parsed.issues || [],
          suggestions: parsed.suggestions || [],
          positives: parsed.positives || [],
          diffSource: "workspace", // Will be set by caller
          statSummary: "",
          statusSummary: "",
          truncated: false,
        };
      }
    }
  } catch {
    // If JSON parsing fails, fall through to text parsing
  }

  // Fallback: Parse as structured text
  const lines = normalized.split("\n");
  const issues: CodeReviewResult["issues"] = [];
  const suggestions: string[] = [];
  const positives: string[] = [];
  let summary = "";
  let currentSection: "summary" | "issues" | "suggestions" | "positives" | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Detect section headers
    if (/^summary|概述|总结/i.test(line)) {
      currentSection = "summary";
      continue;
    }
    if (/^issues?|问题|发现|issues found/i.test(line)) {
      currentSection = "issues";
      continue;
    }
    if (/^suggestions?|建议|改进建议/i.test(line)) {
      currentSection = "suggestions";
      continue;
    }
    if (/^positives?|优点|做得好的地方/i.test(line)) {
      currentSection = "positives";
      continue;
    }

    // Parse content based on current section
    if (currentSection === "summary") {
      if (!summary) {
        summary = line;
      } else {
        summary += " " + line;
      }
    } else if (currentSection === "issues") {
      // Try to parse issue format: [SEVERITY] Category: Description
      const severityMatch = line.match(/^\[?(critical|warning|suggestion|严重|警告|建议)\]?/i);
      const severity = severityMatch
        ? (severityMatch[1].toLowerCase().includes("critical") || severityMatch[1].includes("严重")
            ? "critical"
            : severityMatch[1].toLowerCase().includes("warning") || severityMatch[1].includes("警告")
              ? "warning"
              : "suggestion")
        : "suggestion";
      
      const categoryMatch = line.match(/(?:\[.*?\]\s*)?([^:]+):/);
      const category = categoryMatch ? categoryMatch[1].trim() : "General";
      const description = line.replace(/^\[.*?\]\s*[^:]+:\s*/, "").trim() || line;

      issues.push({
        severity,
        category,
        description,
      });
    } else if (currentSection === "suggestions") {
      const cleanSuggestion = line.replace(/^[-•*]\s*/, "").trim();
      if (cleanSuggestion) {
        suggestions.push(cleanSuggestion);
      }
    } else if (currentSection === "positives") {
      const cleanPositive = line.replace(/^[-•*]\s*/, "").trim();
      if (cleanPositive) {
        positives.push(cleanPositive);
      }
    }
  }

  // If no structured content found, use the entire text as summary
  if (!summary && issues.length === 0 && suggestions.length === 0) {
    summary = normalized;
  }

  return {
    summary: summary || "Code review completed",
    issues,
    suggestions,
    positives,
    diffSource: "workspace", // Will be set by caller
    statSummary: "",
    statusSummary: "",
    truncated: false,
  };
}

export async function generateCodeReview(
  userIntent: string
): Promise<CodeReviewResult> {
  const repositoryDiff = await readRepositoryDiff();
  const client = getAnthropicClient();

  const systemPrompt = `You are Ariadne's code review skill. Analyze the provided git diff and provide constructive, actionable feedback.

Requirements:
- Output a structured review in JSON format with the following structure:
  {
    "summary": "Brief overall assessment (1-2 sentences)",
    "issues": [
      {
        "severity": "critical" | "warning" | "suggestion",
        "category": "Category name (e.g., 'Security', 'Performance', 'Code Quality')",
        "description": "Detailed description of the issue",
        "location": "Optional file/line reference if applicable"
      }
    ],
    "suggestions": ["Actionable improvement suggestions"],
    "positives": ["Things done well or good practices observed"]
  }
- Focus on: security vulnerabilities, performance issues, code quality, best practices, potential bugs
- Be constructive and specific
- Prioritize critical issues first
- If no issues found, still provide positive feedback and suggestions for improvement
- Keep the review concise but thorough`;

  const userMessage = `User request: ${
    userIntent || "Review my code changes"
  }
Diff source: ${
    repositoryDiff.diffSource === "staged" ? "staged changes" : "working tree"
  }
Git status summary:
${repositoryDiff.statusSummary || "No status information"}

Git diff stats:
${repositoryDiff.statSummary}

Diff (may be truncated for cost control):
${repositoryDiff.diff}`;

  const response = await client.messages.create({
    model: getHighTierModel(),
    max_tokens: 2000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  const contentBlocks = response.content ?? [];

  const textBlocks = contentBlocks
    .filter(
      (block): block is { type: "text"; text: string } => block.type === "text"
    )
    .map((block) => block.text);

  const fullText = normalizeText(textBlocks.join("\n"));
  if (!fullText) {
    throw new Error("The model returned an empty code review.");
  }

  const reviewResult = parseReviewResponse(fullText);

  return {
    ...reviewResult,
    diffSource: repositoryDiff.diffSource,
    statSummary: repositoryDiff.statSummary,
    statusSummary: repositoryDiff.statusSummary,
    truncated: repositoryDiff.truncated,
  };
}

