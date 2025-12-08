import { describe, test, expect } from "bun:test";
import {
  AnthropicError,
  AuthenticationError,
  RateLimitError,
  APIError,
  ValidationError,
  NetworkError,
  StreamInterruptedError,
} from "@/errors";

describe("Error Classes", () => {
  describe("AnthropicError", () => {
    test("should create error with message", () => {
      const error = new AnthropicError("Test error");
      expect(error.message).toBe("Test error");
      expect(error.name).toBe("AnthropicError");
      expect(error.statusCode).toBeUndefined();
    });

    test("should create error with message and status code", () => {
      const error = new AnthropicError("Test error", 500);
      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(500);
    });

    test("should be instance of Error", () => {
      const error = new AnthropicError("Test error");
      expect(error instanceof Error).toBe(true);
      expect(error instanceof AnthropicError).toBe(true);
    });
  });

  describe("AuthenticationError", () => {
    test("should create error with default message", () => {
      const error = new AuthenticationError();
      expect(error.message).toBe("Invalid API key");
      expect(error.name).toBe("AuthenticationError");
      expect(error.statusCode).toBe(401);
    });

    test("should create error with custom message", () => {
      const error = new AuthenticationError("Custom auth error");
      expect(error.message).toBe("Custom auth error");
      expect(error.statusCode).toBe(401);
    });

    test("should be instance of AnthropicError", () => {
      const error = new AuthenticationError();
      expect(error instanceof AnthropicError).toBe(true);
      expect(error instanceof AuthenticationError).toBe(true);
    });
  });

  describe("RateLimitError", () => {
    test("should create error with default message", () => {
      const error = new RateLimitError();
      expect(error.message).toBe("Rate limit exceeded");
      expect(error.name).toBe("RateLimitError");
      expect(error.statusCode).toBe(429);
      expect(error.retryAfter).toBeUndefined();
    });

    test("should create error with retry-after value", () => {
      const error = new RateLimitError("Rate limited", 60);
      expect(error.message).toBe("Rate limited");
      expect(error.retryAfter).toBe(60);
      expect(error.statusCode).toBe(429);
    });

    test("should be instance of AnthropicError", () => {
      const error = new RateLimitError();
      expect(error instanceof AnthropicError).toBe(true);
      expect(error instanceof RateLimitError).toBe(true);
    });
  });

  describe("APIError", () => {
    test("should create error with message and status code", () => {
      const error = new APIError("Bad request", 400);
      expect(error.message).toBe("Bad request");
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe("APIError");
      expect(error.errorType).toBeUndefined();
    });

    test("should create error with error type", () => {
      const error = new APIError(
        "Invalid request",
        400,
        "invalid_request_error"
      );
      expect(error.message).toBe("Invalid request");
      expect(error.statusCode).toBe(400);
      expect(error.errorType).toBe("invalid_request_error");
    });

    test("should be instance of AnthropicError", () => {
      const error = new APIError("Test", 500);
      expect(error instanceof AnthropicError).toBe(true);
      expect(error instanceof APIError).toBe(true);
    });
  });

  describe("ValidationError", () => {
    test("should create error with message", () => {
      const error = new ValidationError("Invalid parameter");
      expect(error.message).toBe("Invalid parameter");
      expect(error.name).toBe("ValidationError");
    });

    test("should be instance of AnthropicError", () => {
      const error = new ValidationError("Test");
      expect(error instanceof AnthropicError).toBe(true);
      expect(error instanceof ValidationError).toBe(true);
    });
  });

  describe("NetworkError", () => {
    test("should create error with message", () => {
      const error = new NetworkError("Connection failed");
      expect(error.message).toBe("Connection failed");
      expect(error.name).toBe("NetworkError");
      expect(error.cause).toBeUndefined();
    });

    test("should create error with cause", () => {
      const cause = new Error("Original error");
      const error = new NetworkError("Connection failed", cause);
      expect(error.message).toBe("Connection failed");
      expect(error.cause).toBe(cause);
    });

    test("should be instance of AnthropicError", () => {
      const error = new NetworkError("Test");
      expect(error instanceof AnthropicError).toBe(true);
      expect(error instanceof NetworkError).toBe(true);
    });
  });

  describe("StreamInterruptedError", () => {
    test("should create error with default message", () => {
      const error = new StreamInterruptedError();
      expect(error.message).toBe("Stream was interrupted unexpectedly");
      expect(error.name).toBe("StreamInterruptedError");
    });

    test("should create error with custom message", () => {
      const error = new StreamInterruptedError("Custom interruption");
      expect(error.message).toBe("Custom interruption");
    });

    test("should be instance of AnthropicError", () => {
      const error = new StreamInterruptedError();
      expect(error instanceof AnthropicError).toBe(true);
      expect(error instanceof StreamInterruptedError).toBe(true);
    });
  });
});
