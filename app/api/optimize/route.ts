// app/api/optimize/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { optimizeGeneratedImage } from '@/lib/aiClient';
import { getCorsHeaders } from '@/lib/server/cors';
import { completeTask, createTask, failTask, setTaskStatus } from '@/lib/server/taskStore';
import { buildOptimizationPrompt } from '@/lib/promptBuilder';
import { OptimizeRequest, OptimizeType } from '@/lib/types';

const validOptimizeTypes: OptimizeType[] = [
  'fix-hand-edges',
  'enhance-realism',
  'optimize-subject-blend',
  'optimize-background-blend',
  'fix-hand-object-contact',
  'reduce-ai-feel',
];

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

async function processOptimizeTask(taskId: string, request: OptimizeRequest) {
  try {
    setTaskStatus(taskId, 'processing');
    const result = await optimizeGeneratedImage(request);

    completeTask(taskId, {
      resultImageUrl: result.resultImageUrl,
      prompt: result.optimizationPrompt,
      message: result.message,
    });
  } catch (error) {
    console.error('Optimize task error:', error);
    failTask(taskId, error instanceof Error ? error.message : '优化失败，请重试');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, optimizeType, currentPrompt } = body as {
      imageUrl: string;
      optimizeType: OptimizeType;
      currentPrompt: string;
    };

    // 校验优化类型
    if (!validOptimizeTypes.includes(optimizeType)) {
      return NextResponse.json(
        { success: false, message: '无效的优化类型' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    if (!currentPrompt) {
      return NextResponse.json(
        { success: false, message: '缺少当前 Prompt' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    // 生成优化 prompt
    const optimizationPrompt = buildOptimizationPrompt(optimizeType, currentPrompt);

    const task = createTask('optimize');

    const optimizeRequest: OptimizeRequest = {
      imageUrl,
      optimizeType,
      currentPrompt: optimizationPrompt,
    };

    void processOptimizeTask(task.id, optimizeRequest);

    return NextResponse.json(
      {
        success: true,
        taskId: task.id,
        status: task.status,
        message: '优化任务已创建',
      },
      {
        headers: getCorsHeaders(),
      }
    );
  } catch (error) {
    console.error('Optimize API error:', error);

    const message =
      error instanceof Error ? error.message : '优化失败，请重试';

    return NextResponse.json(
      { success: false, message },
      {
        status: 500,
        headers: getCorsHeaders(),
      }
    );
  }
}
