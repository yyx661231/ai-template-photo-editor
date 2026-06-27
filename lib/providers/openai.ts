import { readFile } from 'fs/promises';
import path from 'path';
import { getTemplateById } from '../templates';
import { EditMode, GenerateRequest, OptimizeRequest, TaskResultPayload } from '../types';
import { ImageEditProvider } from './types';

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1.5';
const DEFAULT_OUTPUT_FORMAT = 'jpeg';
const REQUEST_TIMEOUT_MS = Number(process.env.OPENAI_REQUEST_TIMEOUT_MS || 60000);

interface OpenAIImageResponse {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
}

function getOpenAIApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('未配置 OPENAI_API_KEY，请在后端环境变量中设置后再重试。');
  }

  return apiKey;
}

function getMimeTypeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';

  return 'image/jpeg';
}

async function localFileToDataUrl(publicPath: string): Promise<string> {
  const absolutePath = path.join(process.cwd(), 'public', publicPath.replace(/^\//, ''));
  let fileBuffer: Buffer;

  try {
    fileBuffer = await readFile(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`模板图片不存在：${publicPath}。请将文件放到 public 目录后再重试。`);
    }

    throw error;
  }

  const mimeType = getMimeTypeFromPath(absolutePath);

  return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
}

async function normalizeImageSource(imageSource: string): Promise<string> {
  if (imageSource.startsWith('data:')) {
    return imageSource;
  }

  if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
    return imageSource;
  }

  if (imageSource.startsWith('/')) {
    return localFileToDataUrl(imageSource);
  }

  throw new Error(`不支持的图片来源：${imageSource}`);
}

function buildOrderedEditPrompt(mode: EditMode, basePrompt: string): string {
  const modeInstructionMap: Record<EditMode, string> = {
    'replace-hand':
      '输入图像顺序说明：第 1 张是模板底图，第 2 张是手部参考图。必须以第 1 张模板为基础，只参考第 2 张中的手部特征来替换模板中的手，不要改动模板中的其他区域。',
    'replace-background':
      '输入图像顺序说明：第 1 张是模板底图，第 2 张是场景参考图。必须以第 1 张模板为基础，只替换背景或场景区域，第 2 张只用于提供环境与氛围参考。',
    'replace-both':
      '输入图像顺序说明：第 1 张是模板底图，第 2 张是手部参考图，第 3 张是场景参考图。必须以第 1 张模板为基础，用第 2 张替换手部特征，用第 3 张替换背景场景，保留模板中的构图与物体位置。',
  };

  return `${modeInstructionMap[mode]}\n\n${basePrompt}`;
}

async function callOpenAIImageEdit(params: {
  images: string[];
  prompt: string;
  size?: 'auto' | '1024x1024' | '1536x1024' | '1024x1536';
}): Promise<string> {
  const apiKey = getOpenAIApiKey();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${OPENAI_BASE_URL}/images/edits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_IMAGE_MODEL,
        images: params.images.map((imageUrl) => ({
          image_url: imageUrl,
        })),
        prompt: params.prompt,
        input_fidelity: 'high',
        size: params.size || '1536x1024',
        quality: 'high',
        output_format: DEFAULT_OUTPUT_FORMAT,
      }),
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as
      | OpenAIImageResponse
      | { error?: { message?: string } }
      | null;

    if (!response.ok) {
      const apiMessage =
        payload && 'error' in payload ? payload.error?.message : undefined;

      throw new Error(apiMessage || '真实图片编辑接口调用失败。');
    }

    const firstImage =
      payload && 'data' in payload && Array.isArray(payload.data)
        ? payload.data[0]
        : undefined;

    if (firstImage?.b64_json) {
      return `data:image/${DEFAULT_OUTPUT_FORMAT};base64,${firstImage.b64_json}`;
    }

    if (firstImage?.url) {
      return firstImage.url;
    }

    throw new Error('真实图片编辑接口未返回可用图片结果。');
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new Error(`调用图像编辑服务超时，已等待 ${REQUEST_TIMEOUT_MS}ms。`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export class OpenAIImageProvider implements ImageEditProvider {
  async generateImageEdit(request: GenerateRequest): Promise<TaskResultPayload> {
    const template = getTemplateById(request.templateId);

    if (!template) {
      throw new Error('找不到对应模板，无法生成。');
    }

    const images = [await normalizeImageSource(template.imageUrl)];

    if (request.handImage) {
      images.push(await normalizeImageSource(request.handImage));
    }

    if (request.sceneImage) {
      images.push(await normalizeImageSource(request.sceneImage));
    }

    const prompt = buildOrderedEditPrompt(request.mode, request.prompt || '');
    const resultImageUrl = await callOpenAIImageEdit({
      images,
      prompt,
      size: '1536x1024',
    });

    return {
      resultImageUrl,
      prompt,
      message: '生成完成',
    };
  }

  async optimizeGeneratedImage(request: OptimizeRequest): Promise<TaskResultPayload> {
    const normalizedInput = await normalizeImageSource(request.imageUrl);
    const resultImageUrl = await callOpenAIImageEdit({
      images: [normalizedInput],
      prompt: request.currentPrompt,
      size: '1536x1024',
    });

    return {
      resultImageUrl,
      prompt: request.currentPrompt,
      message: '优化完成',
    };
  }
}
