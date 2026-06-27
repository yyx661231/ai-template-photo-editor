// lib/types.ts

export type EditMode = 'replace-hand' | 'replace-background' | 'replace-both';

export type OptimizeType = 
  | 'fix-hand-edges'
  | 'enhance-realism'
  | 'optimize-subject-blend'
  | 'optimize-background-blend'
  | 'fix-hand-object-contact'
  | 'reduce-ai-feel';

export interface TemplateItem {
  id: string;
  name: string;
  thumbnail: string;
  imageUrl: string;
  supportedModes: EditMode[];
  mainSubject: string;
  replaceableAreas: string[];
  description: string;
  defaultPromptNotes: string;
}

export interface UploadedImages {
  handImage: string | null;
  sceneImage: string | null;
}

export interface GenerateRequest {
  mode: EditMode;
  templateId: string;
  handImage?: string;
  sceneImage?: string;
  prompt?: string;
}

export type TaskStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface GenerateResponse {
  success: boolean;
  resultImageUrl: string;
  prompt: string;
  message: string;
}

export interface GenerateTaskResponse {
  success: boolean;
  taskId: string;
  status: TaskStatus;
  message: string;
}

export interface OptimizeRequest {
  imageUrl: string;
  optimizeType: OptimizeType;
  currentPrompt: string;
}

export interface OptimizeResponse {
  success: boolean;
  resultImageUrl: string;
  optimizationPrompt: string;
  message: string;
}

export interface TaskResultPayload {
  resultImageUrl: string;
  prompt: string;
  message: string;
}

export interface TaskRecord {
  id: string;
  type: 'generate' | 'optimize';
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  error?: string;
  result?: TaskResultPayload;
}

export interface GenerationStep {
  id: number;
  text: string;
}
