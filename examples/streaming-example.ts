import { adaptive } from '../src/index.js';
import { streamText } from 'ai';

async function main() {
  const result = streamText({
    model: adaptive(''),
    prompt: 'Explain machine learning in simple terms',
  });

  console.log('Streaming response:');

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }

  console.log('\n\nFinal result:');
  console.log('Provider:', (await result.providerMetadata)?.adaptive?.provider);
  console.log('Model:', (await result.response).modelId);
  console.log('Usage:', await result.usage);
}

main().catch(console.error);
