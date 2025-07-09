import { adaptive } from '../src/index.js';
import { generateText } from 'ai';

async function main() {
  console.log('=== Adaptive AI Provider as Model Gateway ===\n');

  // Example 1: Auto-routing to best available model
  console.log('1. Auto-routing (empty model ID):');
  const autoResult = await generateText({
    model: adaptive(''),
    prompt: 'What is the capital of France?',
  });
  console.log('Response:', autoResult.text);
  console.log(
    'Provider used:',
    autoResult.providerMetadata?.adaptive?.provider
  );
  console.log('Model used:', autoResult.response.modelId);
  console.log();

  // Example 2: Specific provider routing
  console.log('2. OpenAI routing:');
  const openaiResult = await generateText({
    model: adaptive('openai-gpt-4o'),
    prompt: 'Explain quantum computing briefly',
  });
  console.log('Response:', openaiResult.text);
  console.log(
    'Provider used:',
    openaiResult.providerMetadata?.adaptive?.provider
  );
  console.log('Model used:', openaiResult.response.modelId);
  console.log();

  // Example 3: Anthropic routing
  console.log('3. Anthropic routing:');
  const anthropicResult = await generateText({
    model: adaptive('anthropic-claude-4-sonnet'),
    prompt: 'What are the benefits of TypeScript?',
  });
  console.log('Response:', anthropicResult.text);
  console.log(
    'Provider used:',
    anthropicResult.providerMetadata?.adaptive?.provider
  );
  console.log('Model used:', anthropicResult.response.modelId);
  console.log();

  // Example 4: Fallback handling
  console.log('4. Fallback example:');
  try {
    const fallbackResult = await generateText({
      model: adaptive('nonexistent-model'),
      prompt: 'This should fallback to default',
    });
    console.log('Response:', fallbackResult.text);
    console.log(
      'Provider used:',
      fallbackResult.providerMetadata?.adaptive?.provider
    );
    console.log('Model used:', fallbackResult.response.modelId);
  } catch (error) {
    console.log('Error (expected):', error.message);
  }
}

main().catch(console.error);

