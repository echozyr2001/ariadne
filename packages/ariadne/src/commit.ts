import { getAnthropicClient } from "@/anthropicClient";
import { readRepositoryDiff } from "@/git";
import { getHighTierModel } from "@/modelConfig";

export interface CommitMessageResult {
  subject: string;
  body: string;
  diffSource: "staged" | "workspace";
  statSummary: string;
  statusSummary: string;
  truncated: boolean;
}

function normalizeText(content: string): string {
  return content.replace(/\r\n/g, "\n").trim();
}

export async function generateCommitMessage(
  userIntent: string
): Promise<CommitMessageResult> {
  const repositoryDiff = await readRepositoryDiff();
  const client = getAnthropicClient();

  const systemPrompt = `You are Ariadne's commit skill. Write concise, conventional commit messages that summarize the provided git diff.

Requirements:
- Output ONLY the commit message text (no code fences or explanations)
- Subject line <= 72 characters, lowercase type prefixes are allowed but optional
- Include an optional body separated by a blank line with wrapped lines (<= 72 chars)
- Highlight the most important behavioral changes instead of file lists
- Never include diff hunks verbatim
- Mention if the diff was truncated`;

  const userMessage = `User request: ${userIntent || "Generate a commit message"}
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
    max_tokens: 320,
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
    throw new Error("The model returned an empty commit message.");
  }

  const [subjectLine, ...bodyLines] = fullText.split("\n");
  const subject = subjectLine?.trim() || "chore: update files";

  return {
    subject,
    body: bodyLines.join("\n").trim(),
    diffSource: repositoryDiff.diffSource,
    statSummary: repositoryDiff.statSummary,
    statusSummary: repositoryDiff.statusSummary,
    truncated: repositoryDiff.truncated,
  };
}
