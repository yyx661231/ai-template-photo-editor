import { TaskRecord, TaskResultPayload, TaskStatus } from '../types';

const tasks = new Map<string, TaskRecord>();

function now() {
  return Date.now();
}

export function createTask(type: 'generate' | 'optimize'): TaskRecord {
  const task: TaskRecord = {
    id: crypto.randomUUID(),
    type,
    status: 'queued',
    createdAt: now(),
    updatedAt: now(),
  };

  tasks.set(task.id, task);
  return task;
}

export function getTask(taskId: string): TaskRecord | undefined {
  return tasks.get(taskId);
}

export function setTaskStatus(taskId: string, status: TaskStatus): TaskRecord | undefined {
  const task = tasks.get(taskId);

  if (!task) return undefined;

  const nextTask: TaskRecord = {
    ...task,
    status,
    updatedAt: now(),
  };

  tasks.set(taskId, nextTask);
  return nextTask;
}

export function completeTask(taskId: string, result: TaskResultPayload): TaskRecord | undefined {
  const task = tasks.get(taskId);

  if (!task) return undefined;

  const nextTask: TaskRecord = {
    ...task,
    status: 'completed',
    updatedAt: now(),
    result,
    error: undefined,
  };

  tasks.set(taskId, nextTask);
  return nextTask;
}

export function failTask(taskId: string, error: string): TaskRecord | undefined {
  const task = tasks.get(taskId);

  if (!task) return undefined;

  const nextTask: TaskRecord = {
    ...task,
    status: 'failed',
    updatedAt: now(),
    error,
  };

  tasks.set(taskId, nextTask);
  return nextTask;
}
