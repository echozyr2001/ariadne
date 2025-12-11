import { $ } from "bun";

const MAX_DIFF_CHARS = 12000;

export type DiffSource = "staged" | "workspace";

export interface RepositoryDiff {
  diff: string;
  diffSource: DiffSource;
  truncated: boolean;
  statSummary: string;
  statusSummary: string;
}

async function runGit(args: string[]): Promise<string> {
  try {
    return await $`git ${args}`.text();
  } catch (error) {
    if (error instanceof $.ShellError) {
      const stderr =
        error.stderr && error.stderr.length
          ? new TextDecoder().decode(error.stderr).trim()
          : "";
      const details = stderr || `exit code ${error.exitCode ?? "unknown"}`;
      throw new Error(`Failed to run "git ${args.join(" ")}": ${details}`);
    }
    throw error instanceof Error
      ? error
      : new Error(`Failed to run "git ${args.join(" ")}"`);
  }
}

function truncateDiff(diff: string): { diff: string; truncated: boolean } {
  if (diff.length <= MAX_DIFF_CHARS) {
    return { diff, truncated: false };
  }

  const sliced = diff.slice(0, MAX_DIFF_CHARS);
  const notice = `\n...\n[Diff truncated after ${MAX_DIFF_CHARS} characters to control token usage]\n`;
  return { diff: `${sliced}${notice}`, truncated: true };
}

async function collectDiff(source: DiffSource): Promise<RepositoryDiff | null> {
  const baseArgs = ["diff", "--no-color", "--no-ext-diff"];
  if (source === "staged") {
    baseArgs.push("--cached");
  }

  const diffOutput = (await runGit(baseArgs)).trim();
  if (!diffOutput) {
    return null;
  }

  const statOutput = (await runGit([...baseArgs, "--stat"])).trim();
  const statusOutput = (await runGit(["status", "--short"])).trim();
  const statusSummary = summarizeStatusOutput(statusOutput, source);

  const { diff, truncated } = truncateDiff(diffOutput);

  return {
    diff,
    diffSource: source,
    truncated,
    statSummary: statOutput || "No stat summary available",
    statusSummary,
  };
}

export async function readRepositoryDiff(): Promise<RepositoryDiff> {
  // Prioritize staged changes so we describe what will be committed.
  const staged = await collectDiff("staged");
  if (staged) {
    return staged;
  }

  const workspace = await collectDiff("workspace");
  if (workspace) {
    return workspace;
  }

  throw new Error(
    "No git changes detected. Stage files or modify your working tree before requesting a commit message."
  );
}

export function summarizeStatusOutput(
  rawStatus: string,
  source: DiffSource
): string {
  const lines = rawStatus
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return source === "staged" ? "No staged changes" : "Clean working tree";
  }

  if (source === "staged") {
    const stagedOnly = lines.filter((line) => {
      const indicator = line[0];
      return indicator !== " " && indicator !== "?";
    });

    if (stagedOnly.length === 0) {
      return "No staged changes";
    }

    return stagedOnly.join("\n");
  }

  return lines.join("\n");
}
