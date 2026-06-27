import { OpenAIImageProvider } from './openai';
import { ImageEditProvider } from './types';

export function getImageEditProvider(): ImageEditProvider {
  const provider = process.env.IMAGE_PROVIDER || 'openai';

  switch (provider) {
    case 'openai':
      return new OpenAIImageProvider();
    default:
      throw new Error(`未支持的图片服务提供商：${provider}`);
  }
}
