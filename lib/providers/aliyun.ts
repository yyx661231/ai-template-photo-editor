import { readFile } from 'fs/promises';
import path from 'path';
import { getTemplateById } from '../templates';
import { GenerateRequest, OptimizeRequest, TaskResultPayload } from '../types';
import { ImageEditProvider } from './types';

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL =
  process.env.DASHSCOPE_BASE_URL ||
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation';
const DASHSCOPE_MODEL = process.env.DASHSCOPE_MODEL || 'wan2.7-image-pro';
const DASHSCOPE_SIZE = process.env.DASHSCOPE_IMAGE_SIZE || '1K';
const REQUEST_TIMEOUT_MS = Number(process.env.DASHSCOPE_REQUEST_TIMEOUT_MS || 600000);
const DASHSCOPE_POLL_INTERVAL_MS = Number(process.env.DASHSCOPE_POLL_INTERVAL_MS || 5000);
const DASHSCOPE_POLL_MAX_ATTEMPTS = Number(process.env.DASHSCOPE_POLL_MAX_ATTEMPTS || 120);

interface DashScopeCreateTaskResponse {
  request_id?: string;
  code?: string;
  message?: string;
  output?: {
    task_id?: string;
    task_status?: string;
  };
}

interface DashScopeTaskResultResponse {
  request_id?: string;
  code?: string;
  message?: string;
  output?: {
    task_id?: string;
    task_status?: string;
    results?: Array<{
      url?: string;
    }>;
    choices?: Array<{
      message?: {
        content?: Array<{
          type?: string;
          image?: string;
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTaskQueryUrl(taskId: string): string {
  const url = new URL(DASHSCOPE_BASE_URL);
  return `${url.origin}/api/v1/tasks/${taskId}`;
}

async function createDashScopeTask(params: {
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
        'X-DashScope-Async': 'enable',
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
          enable_interleave: false,
        },
      }),
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as DashScopeCreateTaskResponse | null;

    if (!response.ok) {
      throw new Error(payload?.message || '阿里云百炼创建任务失败。');
    }

    if (payload?.code) {
      throw new Error(payload.message || payload.code);
    }

    const taskId = payload?.output?.task_id;

    if (!taskId) {
      throw new Error('阿里云百炼未返回 task_id，无法继续轮询结果。');
    }

    return taskId;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new Error(
        `阿里云百炼创建任务超时，已等待 ${REQUEST_TIMEOUT_MS}ms。建议检查网络或提高 DASHSCOPE_REQUEST_TIMEOUT_MS。`
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function extractImageUrlFromTaskResult(payload: DashScopeTaskResultResponse): string | null {
  const resultsUrl = payload.output?.results?.find((item) => item.url)?.url;
  if (resultsUrl) {
    return resultsUrl;
  }

  const contentList = payload.output?.choices?.[0]?.message?.content || [];
  const imageItem = contentList.find((item) => item.type === 'image' && item.image);

  return imageItem?.image || null;
}

async function pollDashScopeTaskResult(taskId: string): Promise<string> {
  const apiKey = getDashScopeApiKey();
  const taskUrl = getTaskQueryUrl(taskId);

  for (let attempt = 0; attempt < DASHSCOPE_POLL_MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.min(REQUEST_TIMEOUT_MS, 120000));

    try {
      const response = await fetch(taskUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => null)) as DashScopeTaskResultResponse | null;

      if (!response.ok) {
        throw new Error(payload?.message || '阿里云百炼查询任务结果失败。');
      }

      if (payload?.code) {
        throw new Error(payload.message || payload.code);
      }

      const status = payload?.output?.task_status;

      if (status === 'SUCCEEDED') {
        const resultImageUrl = payload ? extractImageUrlFromTaskResult(payload) : null;

        if (!resultImageUrl) {
          throw new Error('阿里云百炼任务成功，但未返回图片 URL。');
        }

        return resultImageUrl;
      }

      if (status === 'FAILED' || status === 'CANCELED' || status === 'CANCELLED') {
        throw new Error(`阿里云百炼任务失败，状态：${status}`);
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // 单次查询超时，继续下一轮轮询
      } else {
        throw error;
      }
    } finally {
      clearTimeout(timeout);
    }

    await sleep(DASHSCOPE_POLL_INTERVAL_MS);
  }

  throw new Error(
    `阿里云百炼任务轮询超时：已轮询 ${DASHSCOPE_POLL_MAX_ATTEMPTS} 次，每次间隔 ${DASHSCOPE_POLL_INTERVAL_MS}ms。`
  );
}

async function callDashScopeImageEditAsync(params: {
  images: string[];
  prompt: string;
}): Promise<string> {
  const taskId = await createDashScopeTask(params);
  return pollDashScopeTaskResult(taskId);
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

    const resultImageUrl = await callDashScopeImageEditAsync({
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

    const resultImageUrl = await callDashScopeImageEditAsync({
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
