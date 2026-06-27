// app/api/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateImageEdit } from '@/lib/aiClient';
import { getCorsHeaders } from '@/lib/server/cors';
import { completeTask, createTask, failTask, setTaskStatus } from '@/lib/server/taskStore';
import { buildImageEditPrompt } from '@/lib/promptBuilder';
import { getTemplateById } from '@/lib/templates';
import { EditMode, GenerateRequest } from '@/lib/types';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

async function processGenerateTask(taskId: string, request: GenerateRequest) {
  try {
    setTaskStatus(taskId, 'processing');
    const result = await generateImageEdit(request);

    completeTask(taskId, {
      resultImageUrl: result.resultImageUrl,
      prompt: result.prompt,
      message: result.message,
    });
  } catch (error) {
    console.error('Generate task error:', error);
    failTask(taskId, error instanceof Error ? error.message : '生成失败，请重试');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, templateId, handImage, sceneImage } = body as {
      mode: EditMode;
      templateId: string;
      handImage?: string;
      sceneImage?: string;
    };

    // 获取模板信息
    const template = getTemplateById(templateId);
    if (!template) {
      return NextResponse.json(
        { success: false, message: '模板不存在' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    // 检查模式支持
    if (!template.supportedModes.includes(mode)) {
      return NextResponse.json(
        { success: false, message: '该模板不支持当前模式' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    // 校验必传图片
    if (mode === 'replace-hand' && !handImage) {
      return NextResponse.json(
        { success: false, message: '请上传手部参考图' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    if (mode === 'replace-background' && !sceneImage) {
      return NextResponse.json(
        { success: false, message: '请上传场景参考图' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    if (mode === 'replace-both' && (!handImage || !sceneImage)) {
      return NextResponse.json(
        { success: false, message: '请同时上传手部参考图和场景参考图' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    // 生成 prompt
    const prompt = buildImageEditPrompt({
      mode,
      template,
      hasHandImage: !!handImage,
      hasSceneImage: !!sceneImage,
    });

    const task = createTask('generate');

    const generateRequest: GenerateRequest = {
      mode,
      templateId,
      handImage,
      sceneImage,
      prompt,
    };

    void processGenerateTask(task.id, generateRequest);

    return NextResponse.json(
      {
        success: true,
        taskId: task.id,
        status: task.status,
        message: '生成任务已创建',
      },
      {
        headers: getCorsHeaders(),
      }
    );
  } catch (error) {
    console.error('Generate API error:', error);

    const message =
      error instanceof Error ? error.message : '生成失败，请重试';

    return NextResponse.json(
      { success: false, message },
      {
        status: 500,
        headers: getCorsHeaders(),
      }
    );
  }
}
