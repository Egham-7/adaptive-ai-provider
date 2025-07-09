# Examples

This directory contains examples for using the adaptive AI provider.

## Basic Example

See `basic-example.ts` for a simple usage example showing:

- Auto-selection by passing an empty string `adaptive('')`
- Specific provider selection like `adaptive('openai-gpt-4o')`

## Model Format

All models must be specified in `providername-modelname` format:

```ts
// Auto-selection (recommended)
adaptive('')

// Specific providers
adaptive('openai-gpt-4o')
adaptive('anthropic-claude-3.5-sonnet')
adaptive('google-gemini-2.5-pro')
```

## Running Examples

```bash
# Build the project first
bun run build

# Run the example
npx tsx examples/basic-example.ts
```

## Using with the AI SDK

To use this provider with actual text generation, you need to install the AI SDK:

```bash
npm install ai
```

Then you can use it like this:

```ts
import { adaptive } from '@ai-sdk/adaptive';
import { generateText } from 'ai';

const { text } = await generateText({
  model: adaptive(''), // Auto-selection
  prompt: 'What is TypeScript?',
});
```