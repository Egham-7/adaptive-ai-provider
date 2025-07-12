# Adaptive AI Provider

The **Adaptive AI Provider** for the [AI SDK](https://ai-sdk.dev/docs) contains language model support for intelligent AI provider selection across multiple AI services with automatic model optimization.

> **Note:** This provider is compatible with Vercel AI SDK v5 and implements the V2 specification with full support for reasoning, file generation, and advanced usage tracking.

## Features

- 🤖 **Intelligent Model Selection** - Automatically selects the best model for your task
- 🔄 **Multi-Provider Support** - Works with OpenAI, Anthropic, Google, DeepSeek, Groq, and more
- 🧠 **V2 Specification Compliant** - Full support for reasoning, file generation, and advanced content types
- 📊 **Enhanced Usage Tracking** - Detailed token tracking including reasoning and cached tokens
- 🔧 **TypeScript Support** - Fully typed with comprehensive test coverage
- 🚀 **Production Ready** - Built for scale with robust error handling

## Setup

The Adaptive AI Provider is available in the `@adaptive-llm/adaptive-ai-provider` module. You can install it with

```bash
npm i @adaptive-llm/adaptive-ai-provider
```

## Provider Instance

You can import the default provider instance `adaptive` from `@adaptive-llm/adaptive-ai-provider`:

```ts
import { adaptive } from '@adaptive-llm/adaptive-ai-provider';
```

## Basic Usage

```ts
import { adaptive } from '@adaptive-llm/adaptive-ai-provider';
import { generateText } from 'ai';

const { text } = await generateText({
  model: adaptive(),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

## Intelligent Model Selection

The provider automatically selects the optimal model for your task without requiring you to specify a model:

```ts
import { adaptive } from '@adaptive-llm/adaptive-ai-provider';
import { generateText, streamText } from 'ai';

// Automatic model selection for text generation
const result = await generateText({
  model: adaptive(),
  prompt: 'Explain quantum computing',
});

// Automatic model selection for streaming
const { textStream } = streamText({
  model: adaptive(),
  prompt: 'Write a story about time travel',
});

for await (const textPart of textStream) {
  process.stdout.write(textPart);
}
```

## V2 Content Types

The provider supports all AI SDK V2 content types including reasoning and file generation:

```ts
import { adaptive } from '@adaptive-llm/adaptive-ai-provider';
import { generateText } from 'ai';

const { content, usage } = await generateText({
  model: adaptive(),
  prompt: 'Solve this math problem and show your reasoning: 2x + 5 = 17',
});

// Access different content types
content.forEach((item) => {
  switch (item.type) {
    case 'text':
      console.log('Text:', item.text);
      break;
    case 'reasoning':
      console.log('Reasoning:', item.text);
      break;
    case 'file':
      console.log('Generated file:', item.mediaType, item.data);
      break;
    case 'tool-call':
      console.log('Tool call:', item.toolName, item.args);
      break;
  }
});

// Enhanced usage tracking
console.log('Token usage:', {
  input: usage.inputTokens,
  output: usage.outputTokens,
  reasoning: usage.reasoningTokens, // For reasoning-capable models
  cached: usage.cachedInputTokens, // For cache hits
});
```

## Tool Support

Full support for function tools and tool calling:

```ts
import { adaptive } from '@adaptive-llm/adaptive-ai-provider';
import { generateText } from 'ai';

const { text } = await generateText({
  model: adaptive(),
  prompt: 'What is the weather like in San Francisco?',
  tools: {
    getWeather: {
      description: 'Get current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' },
        },
        required: ['location'],
      },
      execute: async ({ location }) => {
        // Your weather API call here
        return `The weather in ${location} is sunny, 72°F`;
      },
    },
  },
});
```

## Configuration

You can configure the adaptive provider with custom settings:

```ts
import { createAdaptive } from '@adaptive-llm/adaptive-ai-provider';

const adaptive = createAdaptive({
  baseURL: 'https://your-adaptive-api.com/v1',
  apiKey: 'your-api-key', // or set ADAPTIVE_API_KEY environment variable
  headers: {
    'Custom-Header': 'value',
  },
});
```

## Environment Variables

Set your API key using environment variables:

```bash
export ADAPTIVE_API_KEY="your-api-key"
```

## Supported Features

### Content Types
- ✅ Text generation
- ✅ Reasoning (for o1-style models)
- ✅ File generation (images, audio, documents)
- ✅ Tool calls and results

### Capabilities
- ✅ Streaming responses
- ✅ Function tools
- ✅ Multimodal inputs (text, images, audio, PDFs)
- ✅ Provider metadata
- ✅ Error handling with AI SDK standard errors
- ✅ Usage tracking with reasoning and cached tokens

### AI SDK V2 Compliance
- ✅ ProviderV2 interface
- ✅ LanguageModelV2 implementation
- ✅ All stream event types
- ✅ Enhanced usage information
- ✅ Provider-specific metadata

## API Reference

### `adaptive()`
Creates a language model instance with intelligent model selection.

### `createAdaptive(options)`
Factory function to create a custom provider instance.

**Options:**
- `baseURL?: string` - Custom API endpoint
- `apiKey?: string` - API key (defaults to `ADAPTIVE_API_KEY` env var)
- `headers?: Record<string, string>` - Custom headers
- `fetch?: FetchFunction` - Custom fetch implementation

## Examples

### Basic Text Generation
```ts
import { adaptive } from '@adaptive-llm/adaptive-ai-provider';
import { generateText } from 'ai';

const { text } = await generateText({
  model: adaptive(),
  prompt: 'Explain machine learning in simple terms.',
});
```

### Streaming with Reasoning
```ts
import { adaptive } from '@adaptive-llm/adaptive-ai-provider';
import { streamText } from 'ai';

const { fullStream } = streamText({
  model: adaptive(),
  prompt: 'Solve this step by step: What is 15% of 240?',
});

for await (const part of fullStream) {
  switch (part.type) {
    case 'text':
      process.stdout.write(part.textDelta);
      break;
    case 'reasoning':
      console.log('💭 Reasoning:', part.text);
      break;
    case 'finish':
      console.log('✅ Complete. Tokens:', part.usage);
      break;
  }
}
```

### File Processing
```ts
import { adaptive } from '@adaptive-llm/adaptive-ai-provider';
import { generateText } from 'ai';

const { text } = await generateText({
  model: adaptive(),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Analyze this image' },
        {
          type: 'file',
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...',
          mediaType: 'image/jpeg',
        },
      ],
    },
  ],
});
```

## Error Handling

The provider uses AI SDK's standard error types:

```ts
import { adaptive } from '@adaptive-llm/adaptive-ai-provider';
import { generateText } from 'ai';
import { APICallError, TooManyRequestsError } from 'ai';

try {
  const result = await generateText({
    model: adaptive(),
    prompt: 'Hello world',
  });
} catch (error) {
  if (error instanceof TooManyRequestsError) {
    console.log('Rate limit hit, retry after:', error.retryAfter);
  } else if (error instanceof APICallError) {
    console.log('API error:', error.statusCode, error.message);
  } else {
    console.log('Unexpected error:', error);
  }
}
```

## Contributing

This provider is built to be fully compliant with the AI SDK V2 specification. When contributing:

1. Ensure all tests pass: `npm test`
2. Run type checking: `npm run type-check`
3. Follow the existing code patterns
4. Add tests for new features

## Documentation

Please check out the **[AI SDK documentation](https://ai-sdk.dev/docs)** for more information about using AI providers.