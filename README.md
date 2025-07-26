# Adaptive AI Provider

Intelligent AI provider for [Vercel AI SDK v5](https://ai-sdk.dev/docs) with automatic model selection and V2 specification compliance.

## Features

- 🤖 **Intelligent Model Selection** - Automatically picks optimal models
- 🧠 **V2 Spec Compliant** - Reasoning, file generation, enhanced usage tracking
- 🔄 **Multi-Provider** - OpenAI, Anthropic, Google, DeepSeek, Groq, etc.
- 🚀 **Production Ready** - TypeScript, full test coverage

## Install

```bash
npm i @adaptive-llm/adaptive-ai-provider
```

## Usage

```ts
import { adaptive } from '@adaptive-llm/adaptive-ai-provider';
import { generateText } from 'ai';

// Intelligent model selection
const { text } = await generateText({
  model: adaptive(),
  prompt: 'Explain quantum computing',
});
```

## V2 Content Types

```ts
const { content, usage } = await generateText({
  model: adaptive(),
  prompt: 'Solve: 2x + 5 = 17',
});

// Access reasoning, files, tool calls
content.forEach((item) => {
  switch (item.type) {
    case 'text': console.log(item.text); break;
    case 'reasoning': console.log(item.text); break;
    case 'file': console.log(item.media_type, item.data); break;
    case 'tool-call': console.log(item.toolName, item.args); break;
  }
});

// Enhanced usage tracking
console.log({
  input: usage.inputTokens,
  output: usage.outputTokens,
  reasoning: usage.reasoningTokens,
  cached: usage.cachedInputTokens,
});
```

## Streaming

```ts
const { fullStream } = streamText({
  model: adaptive(),
  prompt: 'Count to 10',
});

for await (const part of fullStream) {
  if (part.type === 'text') process.stdout.write(part.textDelta);
  if (part.type === 'reasoning') console.log('💭', part.text);
}
```

## Tools

```ts
const { text } = await generateText({
  model: adaptive(),
  prompt: 'What is the weather in SF?',
  tools: {
    getWeather: {
      description: 'Get weather for location',
      parameters: {
        type: 'object',
        properties: { location: { type: 'string' } },
        required: ['location'],
      },
      execute: async ({ location }) => `Weather in ${location}: Sunny, 72°F`,
    },
  },
});
```

## Configuration

```ts
import { createAdaptive } from '@adaptive-llm/adaptive-ai-provider';

const adaptive = createAdaptive({
  baseURL: 'https://your-api.com/v1',
  apiKey: 'your-key', // or ADAPTIVE_API_KEY env var
  headers: { 'Custom-Header': 'value' },
});
```

## Multimodal

```ts
const { text } = await generateText({
  model: adaptive(),
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: 'Analyze this image' },
      { type: 'file', data: 'data:image/jpeg;base64,...', media_type: 'image/jpeg' },
    ],
  }],
});
```

## Supported Features

- ✅ Text, reasoning, file generation, tool calls
- ✅ Streaming with all event types
- ✅ Multimodal inputs (images, audio, PDFs)
- ✅ Enhanced usage tracking
- ✅ AI SDK standard error handling
- ✅ Full TypeScript support

## Error Handling

```ts
import { APICallError, TooManyRequestsError } from 'ai';

try {
  const result = await generateText({ model: adaptive(), prompt: 'Hello' });
} catch (error) {
  if (error instanceof TooManyRequestsError) {
    console.log('Rate limited, retry after:', error.retryAfter);
  }
}
```

## Environment

```bash
export ADAPTIVE_API_KEY="your-api-key"
```