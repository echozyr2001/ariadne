import { describe, test, expect } from "bun:test";
import { SSEParser } from "@/streaming";

describe("SSEParser", () => {
  test("parses a single complete event", () => {
    const parser = new SSEParser();
    const input = 'event: message_start\ndata: {"type":"message_start"}\n\n';

    const events = parser.parse(input);

    expect(events).toHaveLength(1);
    expect(events[0]!.event).toBe("message_start");
    expect(events[0]!.data).toBe('{"type":"message_start"}');
  });

  test("parses multiple complete events", () => {
    const parser = new SSEParser();
    const input =
      'event: message_start\ndata: {"type":"message_start"}\n\n' +
      'event: content_block_delta\ndata: {"type":"content_block_delta"}\n\n';

    const events = parser.parse(input);

    expect(events).toHaveLength(2);
    expect(events[0]!.event).toBe("message_start");
    expect(events[1]!.event).toBe("content_block_delta");
  });

  test("buffers incomplete events", () => {
    const parser = new SSEParser();

    // First chunk - incomplete event
    const chunk1 = 'event: message_start\ndata: {"type"';
    const events1 = parser.parse(chunk1);
    expect(events1).toHaveLength(0);

    // Second chunk - completes the event
    const chunk2 = ':"message_start"}\n\n';
    const events2 = parser.parse(chunk2);
    expect(events2).toHaveLength(1);
    expect(events2[0]!.event).toBe("message_start");
    expect(events2[0]!.data).toBe('{"type":"message_start"}');
  });

  test("handles events split across multiple chunks", () => {
    const parser = new SSEParser();

    // First chunk - partial event
    const events1 = parser.parse("event: test\n");
    expect(events1).toHaveLength(0);

    // Second chunk - completes first event and starts second
    const events2 = parser.parse('data: {"a":1}\n\nevent: test2\n');
    expect(events2).toHaveLength(1);
    expect(events2[0]!.event).toBe("test");
    expect(events2[0]!.data).toBe('{"a":1}');

    // Third chunk - completes second event
    const events3 = parser.parse('data: {"b":2}\n\n');
    expect(events3).toHaveLength(1);
    expect(events3[0]!.event).toBe("test2");
    expect(events3[0]!.data).toBe('{"b":2}');
  });

  test("ignores empty events", () => {
    const parser = new SSEParser();
    const input = '\n\nevent: test\ndata: {"x":1}\n\n\n\n';

    const events = parser.parse(input);

    expect(events).toHaveLength(1);
    expect(events[0]!.event).toBe("test");
  });

  test("handles events with extra whitespace", () => {
    const parser = new SSEParser();
    const input =
      'event:  message_start  \ndata:  {"type":"message_start"}  \n\n';

    const events = parser.parse(input);

    expect(events).toHaveLength(1);
    expect(events[0]!.event).toBe("message_start");
    expect(events[0]!.data).toBe('{"type":"message_start"}');
  });

  test("reset clears the buffer", () => {
    const parser = new SSEParser();

    // Add incomplete event to buffer
    parser.parse("event: test\ndata: incomplete");

    // Reset
    parser.reset();

    // New event should not include buffered data
    const events = parser.parse('event: new\ndata: {"x":1}\n\n');
    expect(events).toHaveLength(1);
    expect(events[0]!.event).toBe("new");
  });

  test("handles real Anthropic API event format", () => {
    const parser = new SSEParser();
    const input =
      "event: content_block_delta\n" +
      'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}\n\n';

    const events = parser.parse(input);

    expect(events).toHaveLength(1);
    expect(events[0]!.event).toBe("content_block_delta");

    // Verify JSON can be parsed
    const parsed = JSON.parse(events[0]!.data);
    expect(parsed.type).toBe("content_block_delta");
    expect(parsed.delta.text).toBe("Hello");
  });
});
