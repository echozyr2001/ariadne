/**
 * Base error class for all Anthropic SDK errors
 */
export class AnthropicError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "AnthropicError";
    Object.setPrototypeOf(this, AnthropicError.prototype);
  }
}

/**
 * Error thrown when authentication fails (401 responses)
 */
export class AuthenticationError extends AnthropicError {
  constructor(message: string = "Invalid API key") {
    super(message, 401);
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Error thrown when rate limits are exceeded (429 responses)
 */
export class RateLimitError extends AnthropicError {
  constructor(
    message: string = "Rate limit exceeded",
    public retryAfter?: number
  ) {
    super(message, 429);
    this.name = "RateLimitError";
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Error thrown for other API errors (4xx, 5xx responses)
 */
export class APIError extends AnthropicError {
  constructor(message: string, statusCode: number, public errorType?: string) {
    super(message, statusCode);
    this.name = "APIError";
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

/**
 * Error thrown for parameter validation failures
 */
export class ValidationError extends AnthropicError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown for network-related failures
 */
export class NetworkError extends AnthropicError {
  constructor(message: string, public override cause?: Error) {
    super(message);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Error thrown when stream is interrupted unexpectedly
 */
export class StreamInterruptedError extends AnthropicError {
  constructor(message: string = "Stream was interrupted unexpectedly") {
    super(message);
    this.name = "StreamInterruptedError";
    Object.setPrototypeOf(this, StreamInterruptedError.prototype);
  }
}
