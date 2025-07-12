import { describe, expect, it } from 'vitest';
import { adaptive, createAdaptive } from './adaptive-provider';

describe('adaptiveProvider', () => {
  it('should create a provider instance', () => {
    const provider = createAdaptive({
      apiKey: 'test-key',
      baseURL: 'https://example.com',
    });
    expect(typeof provider).toBe('function');
    expect(provider.languageModel).toBeInstanceOf(Function);
    expect(provider.chat).toBeInstanceOf(Function);
    expect(() => provider()).not.toThrow();
  });

  it('should create a chat model', () => {
    const provider = createAdaptive({
      apiKey: 'test-key',
      baseURL: 'https://example.com',
    });
    const model = provider.chat();
    expect(model).toBeDefined();
    expect(model.modelId).toBe('');
    expect(model.provider).toBe('adaptive.chat');
  });

  it('should create a language model', () => {
    const provider = createAdaptive({
      apiKey: 'test-key',
      baseURL: 'https://example.com',
    });
    const model = provider.languageModel();
    expect(model).toBeDefined();
    expect(model.modelId).toBe('');
    expect(model.provider).toBe('adaptive.chat');
  });

  it('should throw for textEmbeddingModel', () => {
    const provider = createAdaptive({
      apiKey: 'test-key',
      baseURL: 'https://example.com',
    });
    expect(() => provider.textEmbeddingModel('embed-model')).toThrow();
  });

  it('should throw for imageModel', () => {
    const provider = createAdaptive({
      apiKey: 'test-key',
      baseURL: 'https://example.com',
    });
    expect(() => provider.imageModel('image-model')).toThrow();
  });

  it('should provide a default instance', () => {
    expect(typeof adaptive).toBe('function');
    expect(adaptive.languageModel).toBeInstanceOf(Function);
    expect(adaptive.chat).toBeInstanceOf(Function);
  });
});
