import { GenerateRequest, OptimizeRequest, TaskResultPayload } from '../types';

export interface ImageEditProvider {
  generateImageEdit(request: GenerateRequest): Promise<TaskResultPayload>;
  optimizeGeneratedImage(request: OptimizeRequest): Promise<TaskResultPayload>;
}
