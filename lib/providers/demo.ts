import { getTemplateById } from '../templates';
import { GenerateRequest, OptimizeRequest, TaskResultPayload } from '../types';
import { ImageEditProvider } from './types';

function buildDemoPrompt(prefix: string, prompt: string) {
  return `${prefix}\n\n${prompt}`;
}

export class DemoImageProvider implements ImageEditProvider {
  async generateImageEdit(request: GenerateRequest): Promise<TaskResultPayload> {
    const template = getTemplateById(request.templateId);

    if (!template) {
      throw new Error('找不到对应模板，无法生成。');
    }

    return {
      resultImageUrl: template.imageUrl,
      prompt: buildDemoPrompt(
        '当前为演示模式：由于真实图片接口未配置或额度不足，结果图先返回模板图用于产品演示。后续接入兼容图片平台后即可切换为真实生成。',
        request.prompt || ''
      ),
      message: '演示模式已返回模板图',
    };
  }

  async optimizeGeneratedImage(request: OptimizeRequest): Promise<TaskResultPayload> {
    return {
      resultImageUrl: request.imageUrl,
      prompt: buildDemoPrompt(
        '当前为演示模式：二次优化先保留当前结果图，等待后续接入真实图片服务。',
        request.currentPrompt
      ),
      message: '演示模式下暂未执行真实优化',
    };
  }
}
