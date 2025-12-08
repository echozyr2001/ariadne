# @ariadne/anthropic-sdk-light

A lightweight, zero-dependency implementation of the Anthropic Messages API client.

## Features

- **Minimal Bundle Size**: <100KB (vs ~70MB for the official SDK)
- **Zero Runtime Dependencies**: Uses only Bun's built-in APIs
- **Full TypeScript Support**: Complete type definitions
- **Streaming Support**: Server-Sent Events (SSE) streaming
- **Error Handling**: Typed error classes for different failure modes

## Installation

This package is part of the Ariadne workspace and is not published to npm.

## Usage

```typescript
import { AnthropicClient } from '@ariadne/anthropic-sdk-light';

const client = new AnthropicClient({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

// Streaming
const stream = await client.messages.create({
  model: 'claude-3-5-haiku-20241022',
  max_tokens: 256,
  stream: true,
  messages: [{ role: 'user', content: 'Hello!' }]
});

for await (const event of stream) {
  if (event.type === 'content_block_delta') {
    process.stdout.write(event.delta.text);
  }
}

// Non-streaming
const message = await client.messages.create({
  model: 'claude-3-5-haiku-20241022',
  max_tokens: 256,
  stream: false,
  messages: [{ role: 'user', content: 'Hello!' }]
});

console.log(message.content[0].text);
```

## API

### `AnthropicClient`

Main client class for interacting with the Anthropic API.

#### Constructor

```typescript
new AnthropicClient(config: ClientConfig)
```

#### Methods

- `messages.create(params: MessageCreateParams)`: Create a message (streaming or non-streaming)

## License

MIT
