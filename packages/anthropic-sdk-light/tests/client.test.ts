import { describe, test, expect } from "bun:test";
import { AnthropicClient } from "@/client";
import { ValidationError } from "@/errors";

describe("AnthropicClient", () => {
  describe("constructor", () => {
    test("should create client with valid API key", () => {
      const client = new AnthropicClient({ apiKey: "test-api-key" });
      expect(client).toBeDefined();
      expect(client.messages).toBeDefined();
      expect(client.messages.create).toBeDefined();
    });

    test("should use default baseURL when not provided", () => {
      const client = new AnthropicClient({ apiKey: "test-api-key" });
      expect(client).toBeDefined();
    });

    test("should use custom baseURL when provided", () => {
      const client = new AnthropicClient({
        apiKey: "test-api-key",
        baseURL: "https://custom.api.com",
      });
      expect(client).toBeDefined();
    });

    test("should throw error when API key is missing", () => {
      expect(() => {
        new AnthropicClient({ apiKey: "" });
      }).toThrow(ValidationError);
    });

    test("should throw error when API key is only whitespace", () => {
      expect(() => {
        new AnthropicClient({ apiKey: "   " });
      }).toThrow(ValidationError);
    });

    test("should throw descriptive error message when API key is missing", () => {
      expect(() => {
        new AnthropicClient({ apiKey: "" });
      }).toThrow("API key is required");
    });
  });

  describe("messages.create", () => {
    test("should have create method", () => {
      const client = new AnthropicClient({ apiKey: "test-api-key" });
      expect(typeof client.messages.create).toBe("function");
    });

    test("should throw error when model is missing", async () => {
      const client = new AnthropicClient({ apiKey: "test-api-key" });
      await expect(
        client.messages.create({
          model: "",
          max_tokens: 100,
          messages: [{ role: "user", content: "Hello" }],
        })
      ).rejects.toThrow("Missing required parameters");
    });

    test("should throw error when max_tokens is missing", async () => {
      const client = new AnthropicClient({ apiKey: "test-api-key" });
      await expect(
        client.messages.create({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 0,
          messages: [{ role: "user", content: "Hello" }],
        })
      ).rejects.toThrow("Missing required parameters");
    });

    test("should throw error when messages array is empty", async () => {
      const client = new AnthropicClient({ apiKey: "test-api-key" });
      await expect(
        client.messages.create({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 100,
          messages: [],
        })
      ).rejects.toThrow("messages array cannot be empty");
    });

    test("should return Message object for non-streaming request", async () => {
      // Mock fetch for this test
      const mockMessage = {
        id: "msg_123",
        type: "message" as const,
        role: "assistant" as const,
        content: [{ type: "text" as const, text: "Hello!" }],
        model: "claude-3-5-haiku-20241022",
        stop_reason: "end_turn" as const,
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          output_tokens: 5,
        },
      };

      const originalFetch = global.fetch;
      global.fetch = (async () => {
        return new Response(JSON.stringify(mockMessage), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }) as unknown as typeof fetch;

      try {
        const client = new AnthropicClient({ apiKey: "test-api-key" });
        const result = await client.messages.create({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 100,
          messages: [{ role: "user", content: "Hello" }],
          stream: false,
        });

        // Verify it's a Message object, not an AsyncIterable
        expect(result).toBeDefined();
        expect(typeof result).toBe("object");
        expect((result as any).id).toBe("msg_123");
        expect((result as any).type).toBe("message");
        expect((result as any).role).toBe("assistant");
        expect((result as any).content).toEqual([
          { type: "text", text: "Hello!" },
        ]);
        expect((result as any).stop_reason).toBe("end_turn");
      } finally {
        global.fetch = originalFetch;
      }
    });

    test("should default to non-streaming when stream parameter is not provided", async () => {
      // Mock fetch for this test
      const mockMessage = {
        id: "msg_456",
        type: "message" as const,
        role: "assistant" as const,
        content: [{ type: "text" as const, text: "Hi there!" }],
        model: "claude-3-5-haiku-20241022",
        stop_reason: "end_turn" as const,
        stop_sequence: null,
        usage: {
          input_tokens: 8,
          output_tokens: 3,
        },
      };

      const originalFetch = global.fetch;
      global.fetch = (async () => {
        return new Response(JSON.stringify(mockMessage), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }) as unknown as typeof fetch;

      try {
        const client = new AnthropicClient({ apiKey: "test-api-key" });
        const result = await client.messages.create({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 100,
          messages: [{ role: "user", content: "Hello" }],
          // stream parameter not provided - should default to non-streaming
        });

        // Verify it's a Message object
        expect(result).toBeDefined();
        expect(typeof result).toBe("object");
        expect((result as any).id).toBe("msg_456");
        expect((result as any).content).toEqual([
          { type: "text", text: "Hi there!" },
        ]);
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
