# Ariadne

A CLI tool that converts natural language intents into executable Unix terminal commands using AI.

## Project Structure

This is a Bun workspace monorepo containing:

- `packages/ariadne` - The main CLI application
- `packages/anthropic-sdk-light` - A lightweight Anthropic SDK implementation with zero runtime dependencies

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

### Optional environment variables

| Variable | Description |
| --- | --- |
| `ARIADNE_MODEL_HIGH` | Override the advanced model (defaults to `claude-3-5-sonnet-20241022`). |
| `ARIADNE_MODEL_LOW` | Override the lightweight model (defaults to `claude-3-5-haiku-20241022`). |
| `ARIADNE_DEBUG` | Set to any value to enable verbose router diagnostics. |

## Usage

```bash
bun run start "your intent in natural language"
```

Or directly from the ariadne package:

```bash
bun run packages/ariadne/index.ts "your intent in natural language"
```

### Examples

```bash
# List files with details
bun run start "list all files with details"

# Check which process is using a port
bun run start "check which process is using port 8080"

# Find files
bun run start "find all python files in current directory"

# Show disk usage
bun run start "show disk usage"

# Search for text in files
bun run start "search for text 'error' in files"

# Ask for a commit message based on the git diff
bun run start "write a commit message for the current changes"
```

After Ariadne suggests a command, you'll be prompted to execute it. Press `y` to execute, `n` or `Esc` to cancel.

## Built-in Skills

The CLI now routes intents through a lightweight Claude Agent SDK router with two specialties:

- `shell_command` – converts natural language into a single safe Unix command using the low-tier model (fast + cheap).
- `commit_message` – inspects your staged (or working tree) diff and drafts a conventional commit message using the high-tier model for better reasoning. The diff payload is capped at 12k characters to keep token usage predictable.

Keyword heuristics decide common cases instantly; only ambiguous prompts spin up the router (low-tier model, fixed $0.002 budget cap).

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
