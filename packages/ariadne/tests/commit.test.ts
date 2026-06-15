import { beforeEach, expect, mock, test } from "bun:test";
import { generateCommitMessageFromDiff } from "@/commit";

const createMessageMock = mock(async () => ({
  content: [
    {
      type: "text",
      text: "feat: update file handling\n\nAdd value initialization.",
    },
  ],
}));

const resolveModelMock = mock(async () => "claude-test-high");

const repositoryDiff = {
  diff: "diff --git a/file.ts b/file.ts\n+const value = 1;",
  diffSource: "workspace" as const,
  truncated: false,
  statSummary: " file.ts | 1 +",
  statusSummary: " M file.ts",
};

beforeEach(() => {
  createMessageMock.mockClear();
  resolveModelMock.mockClear();
});

test("generates commit messages with the high-tier model", async () => {
  const result = await generateCommitMessageFromDiff(
    "给我一份commit message",
    repositoryDiff,
    {
      client: {
        messages: {
          create: createMessageMock,
        },
      },
      resolveModel: resolveModelMock,
    }
  );

  expect(result.subject).toBe("feat: update file handling");
  expect(result.body).toBe("Add value initialization.");
  expect(resolveModelMock).toHaveBeenCalledTimes(1);

  const calls = createMessageMock.mock.calls as unknown as Array<
    [Record<string, unknown>]
  >;
  expect(calls[0]?.[0]).toMatchObject({
    model: "claude-test-high",
    max_tokens: 320,
  });
});

test("includes the selected model when commit message generation fails", async () => {
  createMessageMock.mockRejectedValueOnce(new Error("Not Allowed"));

  await expect(
    generateCommitMessageFromDiff("给我一份commit message", repositoryDiff, {
      client: {
        messages: {
          create: createMessageMock,
        },
      },
      resolveModel: resolveModelMock,
    })
  ).rejects.toThrow(
    'Commit message generation failed with model "claude-test-high": Not Allowed'
  );
});
