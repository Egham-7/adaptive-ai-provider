import { adaptive } from '../src/index.js';
import { generateText } from 'ai';

async function main() {
  // Auto-selection - let the provider choose the best model
  const model = adaptive('');
  console.log('Auto-selected model:', model.modelId);

  // Specific provider selection
  const specificModel = adaptive('openai-gpt-4o');
  console.log('OpenAI GPT-4o model:', specificModel.modelId);

  const { text, providerMetadata, response } = await generateText({
    model: adaptive(''),
    prompt: 'What is TypeScript?',
  });

  console.log('Response:', text);

  console.log('Provider: ', providerMetadata?.adaptive?.provider);
  console.log('Model: ', response.modelId);
}

main().catch(console.error);

