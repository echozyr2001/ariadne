import { expect, test } from "bun:test";
import { detectSkillByKeyword } from "@/skills";

test("detects commit message intent via keywords", () => {
  const decision = detectSkillByKeyword("please write a git commit message");
  expect(decision).not.toBeNull();
  expect(decision?.skill).toBe("commit_message");
});

test("returns null for standard command requests", () => {
  const decision = detectSkillByKeyword("list all files");
  expect(decision).toBeNull();
});
