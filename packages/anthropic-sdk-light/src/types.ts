export interface ClientConfig {
  apiKey: string;
  baseURL?: string; // Default: "https://api.anthropic.com"
}

export interface MessageCreateParams {
  model: string;
  max_tokens: number;
  messages: MessageParam[];
  system?: string;
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
}

export interface MessageParam {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

export interface ContentBlock {
  type: "text";
  text: string;
}

export interface Message {
  id: string;
  type: "message";
  role: "assistant";
  content: ContentBlock[];
  model: string;
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence" | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export type StreamEvent =
  | MessageStartEvent
  | ContentBlockStartEvent
  | ContentBlockDeltaEvent
  | ContentBlockStopEvent
  | MessageDeltaEvent
  | MessageStopEvent;

export interface MessageStartEvent {
  type: "message_start";
  message: {
    id: string;
    type: "message";
    role: "assistant";
    content: [];
    model: string;
    stop_reason: null;
    stop_sequence: null;
    usage: {
      input_tokens: number;
      output_tokens: number;
    };
  };
}

export interface ContentBlockStartEvent {
  type: "content_block_start";
  index: number;
  content_block: {
    type: "text";
    text: string;
  };
}

export interface ContentBlockDeltaEvent {
  type: "content_block_delta";
  index: number;
  delta: {
    type: "text_delta";
    text: string;
  };
}

export interface ContentBlockStopEvent {
  type: "content_block_stop";
  index: number;
}

export interface MessageDeltaEvent {
  type: "message_delta";
  delta: {
    stop_reason: "end_turn" | "max_tokens" | "stop_sequence";
    stop_sequence?: string | null;
  };
  usage: {
    output_tokens: number;
  };
}

export interface MessageStopEvent {
  type: "message_stop";
}
