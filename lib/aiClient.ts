import { getImageEditProvider } from './providers/providerFactory';
import { GenerateRequest, GenerateResponse, OptimizeRequest, OptimizeResponse } from './types';

export async function generateImageEdit(request: GenerateRequest): Promise<GenerateResponse> {
  const provider = getImageEditProvider();
  const result = await provider.generateImageEdit(request);

  return {
    success: true,
    resultImageUrl: result.resultImageUrl,
    prompt: result.prompt,
    message: result.message,
  };
}

export async function optimizeGeneratedImage(
  request: OptimizeRequest
): Promise<OptimizeResponse> {
  const provider = getImageEditProvider();
  const result = await provider.optimizeGeneratedImage(request);

  return {
    success: true,
    resultImageUrl: result.resultImageUrl,
    optimizationPrompt: result.prompt,
    message: result.message,
  };
}
