import { DemoImageProvider } from './demo';
import { OpenAIImageProvider } from './openai';
import { ImageEditProvider } from './types';

export function getImageEditProvider(): ImageEditProvider {
  const provider = process.env.IMAGE_PROVIDER || 'openai-compatible';

  switch (provider) {
    case 'openai':
    case 'openai-compatible':
      return new OpenAIImageProvider();
    case 'demo':
      return new DemoImageProvider();
    default:
      throw new Error(`未支持的图片服务提供商：${provider}`);
  }
}
