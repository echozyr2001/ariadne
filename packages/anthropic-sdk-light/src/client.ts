import type {
  ClientConfig,
  MessageCreateParams,
  Message,
  StreamEvent,
  MessageStopEvent,
} from "./types";
import {
  AnthropicError,
  AuthenticationError,
  RateLimitError,
  APIError,
  ValidationError,
  NetworkError,
  StreamInterruptedError,
} from "./errors";
import { SSEParser } from "./streaming";

/**
 * Messages API resource
 */
class Messages {
  constructor(private client: Anthropic) {}

  /**
   * Create a message with streaming enabled
   */
  create(
    params: MessageCreateParams & { stream: true }
  ): Promise<AsyncIterable<StreamEvent>>;

  /**
   * Create a message without streaming
   */
  create(params: MessageCreateParams & { stream?: false }): Promise<Message>;

  /**
   * Create a message with the Anthropic API
   * @param params - Message creation parameters
   * @returns Promise resolving to either a Message (non-streaming) or AsyncIterable<StreamEvent> (streaming)
   */
  async create(
    params: MessageCreateParams
  ): Promise<Message | AsyncIterable<StreamEvent>> {
    // Validate required parameters
    if (!params.model || !params.max_tokens || !params.messages) {
      throw new ValidationError(
        "Missing required parameters: model, max_tokens, and messages are required"
      );
    }

    if (!Array.isArray(params.messages) || params.messages.length === 0) {
      throw new ValidationError("messages array cannot be empty");
    }

    // Build request URL
    const url = `${this.client.baseURL}/v1/messages`;

    // Build request headers
    const headers = {
      "X-Api-Key": this.client.apiKey,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    };

    // Build request body
    const body = JSON.stringify(params);

    try {
      // Make the API request
      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
      });

      // Handle error responses
      if (!response.ok) {
        await this.client.handleErrorResponse(response);
      }

      // Handle streaming vs non-streaming responses
      if (params.stream) {
        return this.client.streamMessages(response);
      } else {
        return (await response.json()) as Message;
      }
    } catch (error) {
      // Re-throw our custom errors
      if (error instanceof AnthropicError) {
        throw error;
      }
      // Wrap network errors
      throw new NetworkError(
        `Network error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }
}

export class Anthropic {
  public readonly apiKey: string;
  public readonly baseURL: string;
  public readonly messages: Messages;

  constructor(config: ClientConfig) {
    // Validate API key is provided
    if (!config.apiKey || config.apiKey.trim() === "") {
      throw new ValidationError(
        "API key is required. Please provide a valid API key in the ClientConfig."
      );
    }

    this.apiKey = config.apiKey;
    // Priority: config.baseURL > ANTHROPIC_BASE_URL env var > default
    this.baseURL =
      config.baseURL ||
      process.env.ANTHROPIC_BASE_URL ||
      "https://api.anthropic.com";

    // Initialize Messages API resource
    this.messages = new Messages(this);
  }

  /**
   * Handle error responses from the API
   * @param response - The error response from fetch
   */
  public async handleErrorResponse(response: Response): Promise<never> {
    const statusCode = response.status;
    let errorMessage = `API error (${statusCode})`;
    let errorType: string | undefined;

    try {
      const errorBody = (await response.json()) as any;
      if (errorBody.error?.message) {
        errorMessage = errorBody.error.message;
      }
      if (errorBody.error?.type) {
        errorType = errorBody.error.type;
      }
    } catch {
      // If we can't parse the error body, use the status text
      errorMessage = response.statusText || errorMessage;
    }

    // Throw appropriate error type based on status code
    if (statusCode === 401) {
      throw new AuthenticationError(errorMessage);
    } else if (statusCode === 429) {
      // Parse retry-after header if present
      const retryAfter = response.headers.get("retry-after");
      const retryAfterSeconds = retryAfter
        ? parseInt(retryAfter, 10)
        : undefined;
      throw new RateLimitError(errorMessage, retryAfterSeconds);
    } else {
      throw new APIError(errorMessage, statusCode, errorType);
    }
  }

  /**
   * Stream messages from the API using async generator
   * @param response - The streaming response from fetch
   * @returns AsyncIterable of StreamEvent objects
   */
  public async *streamMessages(response: Response): AsyncIterable<StreamEvent> {
    if (!response.body) {
      throw new AnthropicError("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const parser = new SSEParser();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });

        // Parse SSE events from the chunk
        const events = parser.parse(chunk);

        // Yield each parsed event
        for (const event of events) {
          // Stop on message_stop event
          if (event.event === "message_stop") {
            yield { type: "message_stop" } as MessageStopEvent;
            return;
          }

          // Parse the JSON data and yield the typed event
          try {
            const parsedEvent = JSON.parse(event.data) as StreamEvent;
            yield parsedEvent;
          } catch (error) {
            throw new AnthropicError(
              `Failed to parse event data: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
          }
        }
      }
    } catch (error) {
      // If it's already our error, re-throw it
      if (error instanceof AnthropicError) {
        throw error;
      }
      // Wrap other errors as stream interruption
      throw new StreamInterruptedError(
        `Stream interrupted: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      // Ensure the reader is released
      reader.releaseLock();
    }
  }
}
