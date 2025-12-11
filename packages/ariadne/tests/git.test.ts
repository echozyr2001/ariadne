import { expect, test } from "bun:test";
import { summarizeStatusOutput } from "@/git";

test("summarizeStatusOutput filters staged lines", () => {
  const raw = [" M unstaged.ts", "M  staged.ts", "?? untracked.ts"].join("\n");
  const summary = summarizeStatusOutput(raw, "staged");

  expect(summary).toBe("M  staged.ts");
});

test("summarizeStatusOutput returns clean messages", () => {
  const stagedSummary = summarizeStatusOutput("", "staged");
  const workspaceSummary = summarizeStatusOutput("", "workspace");

  expect(stagedSummary).toBe("No staged changes");
  expect(workspaceSummary).toBe("Clean working tree");
});
