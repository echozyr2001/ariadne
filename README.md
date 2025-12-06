# Ariadne

A CLI tool that converts natural language intents into executable Unix terminal commands using AI.

## Installation

```bash
bun install
```

## Configuration

Set your Anthropic API key as an environment variable:

```bash
export ANTHROPIC_API_KEY='your-api-key-here'
```

Or add it to your shell profile (e.g., `~/.zshrc` or `~/.bashrc`):

```bash
echo 'export ANTHROPIC_API_KEY="your-api-key-here"' >> ~/.zshrc
source ~/.zshrc
```

You can get your API key from [Anthropic's console](https://console.anthropic.com/).

## Usage

```bash
bun run index.ts "your intent in natural language"
```

### Examples

```bash
# List files with details
bun run index.ts "list all files with details"

# Check which process is using a port
bun run index.ts "check which process is using port 8080"

# Find files
bun run index.ts "find all python files in current directory"

# Show disk usage
bun run index.ts "show disk usage"

# Search for text in files
bun run index.ts "search for text 'error' in files"
```

After Ariadne suggests a command, you'll be prompted to execute it. Press `y` to execute, `n` or `Esc` to cancel.

## Development

Run tests:

```bash
bun test
```

Run tests in watch mode:

```bash
bun test:watch
```

## Requirements

- [Bun](https://bun.com) runtime (v1.3.3 or later)
- TypeScript 5+
- Anthropic API key
