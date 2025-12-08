/**
 * Represents a parsed SSE event
 */
export interface SSEEvent {
  event: string;
  data: string;
}

/**
 * SSEParser handles parsing of Server-Sent Events format
 * Supports buffering for incomplete events across multiple chunks
 */
export class SSEParser {
  private buffer: string = "";

  /**
   * Parse SSE formatted text and return complete events
   * Incomplete events are buffered for the next parse call
   *
   * SSE format:
   * event: event_name
   * data: {"json": "data"}
   *
   * (blank line separates events)
   *
   * @param chunk - Raw SSE text chunk
   * @returns Array of parsed SSE events
   */
  parse(chunk: string): SSEEvent[] {
    // Add new chunk to buffer
    this.buffer += chunk;

    const events: SSEEvent[] = [];

    // Split by double newline to find complete events
    // Keep the last part in buffer if incomplete
    const parts = this.buffer.split("\n\n");

    // The last part might be incomplete, so keep it in buffer
    this.buffer = parts[parts.length - 1] ?? "";

    // Process all complete events (all parts except the last)
    for (let i = 0; i < parts.length - 1; i++) {
      const eventText = parts[i]?.trim() ?? "";

      if (eventText === "") {
        continue;
      }

      const event = this.parseEvent(eventText);
      if (event) {
        events.push(event);
      }
    }

    return events;
  }

  /**
   * Parse a single complete event text into an SSEEvent object
   *
   * @param eventText - Complete event text (between double newlines)
   * @returns Parsed SSEEvent or null if invalid
   */
  private parseEvent(eventText: string): SSEEvent | null {
    const lines = eventText.split("\n");

    let eventType = "";
    let eventData = "";

    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventType = line.substring(6).trim();
      } else if (line.startsWith("data:")) {
        eventData = line.substring(5).trim();
      }
    }

    // Both event and data are required
    if (eventType && eventData) {
      return {
        event: eventType,
        data: eventData,
      };
    }

    return null;
  }

  /**
   * Reset the internal buffer
   * Useful when starting a new stream
   */
  reset(): void {
    this.buffer = "";
  }
}
