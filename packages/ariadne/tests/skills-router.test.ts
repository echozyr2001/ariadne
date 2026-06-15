import { beforeEach, expect, mock, test } from "bun:test";

process.env.ARIADNE_MODEL_LOW = "claude-test-low";

const createMessageMock = mock(async () => ({
  content: [
    {
      type: "text",
      text: JSON.stringify({
        skill: "commit_message",
        confidence: 0.94,
        reason: "Chinese request asks for a commit message",
      }),
    },
  ],
}));

mock.module("@/anthropicClient", () => ({
  getAnthropicClient: () => ({
    messages: {
      create: createMessageMock,
    },
  }),
}));

const { determineSkill } = await import("@/skills");

beforeEach(() => {
  createMessageMock.mockClear();
});

test("routes explicit mixed-language commit message requests without the Anthropic router", async () => {
  const decision = await determineSkill("给我一份commit message", {
    useRouterModel: true,
  });

  expect(decision).toEqual({
    skill: "commit_message",
    reason: 'Matched keyword "/commit message/i"',
    confidence: 0.92,
    via: "heuristic",
  });
  expect(createMessageMock).not.toHaveBeenCalled();
});

test("routes mixed-language requests without local keywords through the Anthropic client", async () => {
  const decision = await determineSkill("请帮我处理一下这些改动", {
    useRouterModel: true,
  });

  expect(decision).toEqual({
    skill: "commit_message",
    reason: "Chinese request asks for a commit message",
    confidence: 0.94,
    via: "router",
  });
  expect(createMessageMock).toHaveBeenCalledTimes(1);
  const calls = createMessageMock.mock.calls as unknown as Array<
    [Record<string, unknown>]
  >;
  const request = calls[0]?.[0];

  expect(request).toMatchObject({
    model: "claude-test-low",
    max_tokens: 160,
  });
});

test("does not hide router model configuration errors behind fallback routing", async () => {
  createMessageMock.mockRejectedValueOnce(
    new Error("未找到项目配置，模型: ep-59yg9x-1773657979964125982")
  );

  await expect(
    determineSkill("请帮我处理一下这些改动", {
      useRouterModel: true,
    })
  ).rejects.toThrow("未找到项目配置，模型: ep-59yg9x-1773657979964125982");
});

test("does not hide router model access errors behind fallback routing", async () => {
  createMessageMock.mockRejectedValueOnce(new Error("Not Allowed"));

  await expect(
    determineSkill("请帮我处理一下这些改动", {
      useRouterModel: true,
    })
  ).rejects.toThrow("Not Allowed");
});
