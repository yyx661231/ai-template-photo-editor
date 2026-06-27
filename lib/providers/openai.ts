import { readFile } from 'fs/promises';
import path from 'path';
import { getTemplateById } from '../templates';
import { EditMode, GenerateRequest, OptimizeRequest, TaskResultPayload } from '../types';
import { ImageEditProvider } from './types';

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
const DEFAULT_OUTPUT_FORMAT = 'jpeg';
const REQUEST_TIMEOUT_MS = Number(process.env.OPENAI_REQUEST_TIMEOUT_MS || 180000);

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

function getExtensionFromMimeType(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';

  return 'jpg';
}

function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  const bytes = new Uint8Array(buffer);
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
}

async function localFileToFile(publicPath: string, filenamePrefix: string): Promise<File> {
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
  const ext = getExtensionFromMimeType(mimeType);

  return new File([bufferToArrayBuffer(fileBuffer)], `${filenamePrefix}.${ext}`, {
    type: mimeType,
  });
}

function dataUrlToFile(dataUrl: string, filenamePrefix: string): File {
  const [header, base64Data] = dataUrl.split(',');

  if (!header || !base64Data) {
    throw new Error('无效的图片数据格式。');
  }

  const mimeMatch = header.match(/^data:(.*?);base64$/);
  const mimeType = mimeMatch?.[1] || 'image/jpeg';
  const ext = getExtensionFromMimeType(mimeType);
  const buffer = Buffer.from(base64Data, 'base64');

  return new File([bufferToArrayBuffer(buffer)], `${filenamePrefix}.${ext}`, {
    type: mimeType,
  });
}

async function remoteUrlToFile(imageUrl: string, filenamePrefix: string): Promise<File> {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`无法下载远程图片资源：${imageUrl}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const mimeType =
    response.headers.get('content-type')?.split(';')[0].trim() || 'image/jpeg';
  const ext = getExtensionFromMimeType(mimeType);
  const buffer = Buffer.from(arrayBuffer);

  return new File([bufferToArrayBuffer(buffer)], `${filenamePrefix}.${ext}`, {
    type: mimeType,
  });
}

async function normalizeImageSourceToFile(
  imageSource: string,
  filenamePrefix: string
): Promise<File> {
  if (imageSource.startsWith('data:')) {
    return dataUrlToFile(imageSource, filenamePrefix);
  }

  if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
    return remoteUrlToFile(imageSource, filenamePrefix);
  }

  if (imageSource.startsWith('/')) {
    return localFileToFile(imageSource, filenamePrefix);
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
    const formData = new FormData();

    for (const [index, imageSource] of params.images.entries()) {
      const imageFile = await normalizeImageSourceToFile(imageSource, `input-${index + 1}`);
      formData.append('image', imageFile);
    }

    formData.append('model', OPENAI_IMAGE_MODEL);
    formData.append('prompt', params.prompt);
    formData.append('input_fidelity', 'high');
    formData.append('size', params.size || '1536x1024');
    formData.append('quality', 'high');
    formData.append('output_format', DEFAULT_OUTPUT_FORMAT);

    const response = await fetch(`${OPENAI_BASE_URL}/images/edits`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as
      | OpenAIImageResponse
      | { error?: { message?: string } }
      | null;

    if (!response.ok) {
      const apiMessage =
        payload && 'error' in payload ? payload.error?.message : undefined;

      if (apiMessage?.includes('Incorrect API key provided')) {
        throw new Error('图片接口认证失败：当前 API Key 无效，请检查兼容平台 Key。');
      }

      if (
        apiMessage?.includes('Billing hard limit has been reached') ||
        apiMessage?.includes('insufficient_quota')
      ) {
        throw new Error('图片接口额度不足：当前账户或接入平台余额不够。');
      }

      if (apiMessage?.toLowerCase().includes('model')) {
        throw new Error(
          `图片模型不可用：当前配置模型为 ${OPENAI_IMAGE_MODEL}，请检查接入平台是否支持。`
        );
      }

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
      throw new Error(
        `调用图像编辑服务超时，已等待 ${REQUEST_TIMEOUT_MS}ms，请提高 OPENAI_REQUEST_TIMEOUT_MS 或更换更快的接入平台。`
      );
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

    const images = [template.imageUrl];

    if (request.handImage) {
      images.push(request.handImage);
    }

    if (request.sceneImage) {
      images.push(request.sceneImage);
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
    const resultImageUrl = await callOpenAIImageEdit({
      images: [request.imageUrl],
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
