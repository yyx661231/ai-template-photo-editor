import { readFile } from 'fs/promises';
import path from 'path';
import { getTemplateById } from '../templates';
import { GenerateRequest, OptimizeRequest, TaskResultPayload } from '../types';
import { ImageEditProvider } from './types';

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL =
  process.env.DASHSCOPE_BASE_URL ||
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
const DASHSCOPE_MODEL = process.env.DASHSCOPE_MODEL || 'wan2.7-image-pro';
const DASHSCOPE_SIZE = process.env.DASHSCOPE_IMAGE_SIZE || '2K';
const REQUEST_TIMEOUT_MS = Number(process.env.DASHSCOPE_REQUEST_TIMEOUT_MS || 180000);

interface DashScopeImageResponse {
  request_id?: string;
  code?: string;
  message?: string;
  output?: {
    choices?: Array<{
      message?: {
        content?: Array<{
          image?: string;
          type?: string;
        }>;
      };
    }>;
  };
}

function getDashScopeApiKey(): string {
  if (!DASHSCOPE_API_KEY) {
    throw new Error('未配置 DASHSCOPE_API_KEY，请先在服务端环境变量中填写阿里云百炼 API Key。');
  }

  return DASHSCOPE_API_KEY;
}

function getMimeTypeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.bmp') return 'image/bmp';

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

function buildAliyunPrompt(prefix: string, prompt: string) {
  return `${prefix}\n\n${prompt}`;
}

async function callDashScopeImageEdit(params: {
  images: string[];
  prompt: string;
}): Promise<string> {
  const apiKey = getDashScopeApiKey();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(DASHSCOPE_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DASHSCOPE_MODEL,
        input: {
          messages: [
            {
              role: 'user',
              content: [{ text: params.prompt }, ...params.images.map((image) => ({ image }))],
            },
          ],
        },
        parameters: {
          size: DASHSCOPE_SIZE,
          n: 1,
          watermark: false,
        },
      }),
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as DashScopeImageResponse | null;

    if (!response.ok) {
      throw new Error(payload?.message || '阿里云百炼图像接口调用失败。');
    }

    if (payload?.code) {
      throw new Error(payload.message || payload.code);
    }

    const contentList = payload?.output?.choices?.[0]?.message?.content || [];
    const imageItem = contentList.find((item) => item.type === 'image' && item.image);

    if (!imageItem?.image) {
      throw new Error('阿里云百炼未返回可用图片结果。');
    }

    return imageItem.image;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new Error(
        `阿里云百炼图像接口超时，已等待 ${REQUEST_TIMEOUT_MS}ms。建议提高 DASHSCOPE_REQUEST_TIMEOUT_MS。`
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export class AliyunImageProvider implements ImageEditProvider {
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

    const prompt = buildAliyunPrompt(
      '你正在执行模板化图像编辑任务。请严格保持模板图中的主体布局、物体位置、拍摄角度与画面结构，只根据后续参考图完成手部替换、背景替换或二者同时替换，结果必须自然、真实、无明显合成痕迹。',
      request.prompt || ''
    );

    const resultImageUrl = await callDashScopeImageEdit({
      images,
      prompt,
    });

    return {
      resultImageUrl,
      prompt,
      message: '生成完成',
    };
  }

  async optimizeGeneratedImage(request: OptimizeRequest): Promise<TaskResultPayload> {
    const prompt = buildAliyunPrompt(
      '你正在执行图片二次优化任务。请只优化当前图像的真实感、融合度、边缘与接触关系，不要改变主体构图和核心内容。',
      request.currentPrompt
    );

    const resultImageUrl = await callDashScopeImageEdit({
      images: [await normalizeImageSource(request.imageUrl)],
      prompt,
    });

    return {
      resultImageUrl,
      prompt,
      message: '优化完成',
    };
  }
}
