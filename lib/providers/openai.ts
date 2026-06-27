import { readFile } from 'fs/promises';
import path from 'path';
import { getTemplateById } from '../templates';
import { EditMode, GenerateRequest, OptimizeRequest, TaskResultPayload } from '../types';
import { ImageEditProvider } from './types';

function getExtensionFromMimeType(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';

  return 'jpg';
}

function bufferToBlobPart(buffer: Buffer): Uint8Array {
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
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

  return new File([bufferToBlobPart(fileBuffer)], `${filenamePrefix}.${ext}`, {
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

  return new File([bufferToBlobPart(buffer)], `${filenamePrefix}.${ext}`, {
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

  return new File([bufferToBlobPart(buffer)], `${filenamePrefix}.${ext}`, {
    type: mimeType,
  });
}
