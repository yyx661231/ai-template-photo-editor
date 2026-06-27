import { NextRequest, NextResponse } from 'next/server';
import { getCorsHeaders } from '@/lib/server/cors';
import { getTask } from '@/lib/server/taskStore';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const task = getTask(params.taskId);

  if (!task) {
    return NextResponse.json(
      {
        success: false,
        message: '任务不存在',
      },
      {
        status: 404,
        headers: getCorsHeaders(),
      }
    );
  }

  return NextResponse.json(
    {
      success: true,
      task,
    },
    {
      headers: getCorsHeaders(),
    }
  );
}
