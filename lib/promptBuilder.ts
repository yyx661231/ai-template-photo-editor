// lib/promptBuilder.ts

import { EditMode, OptimizeType, TemplateItem } from './types';

interface BuildPromptParams {
  mode: EditMode;
  template: TemplateItem;
  hasHandImage: boolean;
  hasSceneImage: boolean;
}

export function buildImageEditPrompt(params: BuildPromptParams): string {
  const { mode, template, hasHandImage, hasSceneImage } = params;

  switch (mode) {
    case 'replace-hand':
      return buildReplaceHandPrompt(template);
    case 'replace-background':
      return buildReplaceBackgroundPrompt(template);
    case 'replace-both':
      return buildReplaceBothPrompt(template, hasHandImage, hasSceneImage);
    default:
      return '';
  }
}

function buildReplaceHandPrompt(template: TemplateItem): string {
  return `图片编辑任务：替换手部

【模板信息】
- 模板名称：${template.name}
- 主体：${template.mainSubject}
- 描述：${template.description}

【核心要求】
1. 只替换模板图中的手部区域
2. 非手部内容全部保持不变
3. 保留所有物体，例如苹果笔、手机、杯子、文具等
4. 保留物体的位置、角度、大小、文字、标识和遮挡关系
5. 新手部参考用户上传的手部图片，保持：
   - 手型、肤色、指甲样式
   - 手指比例和皮肤质感
6. 新手必须自然握住原图中的物体
7. 匹配原图的光线方向、阴影、环境反光
8. 匹配原图的景深、透视和相机质感
9. 手部边缘必须自然融合，无明显接缝
10. 避免以下问题：抠图感、硬边、白边、黑边、光晕、塑料皮肤质感、AI合成感

【输出要求】
生成一张自然真实的照片级图片，看起来像真实拍摄。`;
}

function buildReplaceBackgroundPrompt(template: TemplateItem): string {
  return `图片编辑任务：替换背景/场景

【模板信息】
- 模板名称：${template.name}
- 主体：${template.mainSubject}
- 描述：${template.description}

【核心要求】
1. 保留模板中的主体和前景物体（手部、苹果笔、手机、杯子等）
2. 只替换背景/场景区域
3. 新背景参考用户上传的场景图
4. 保持主体姿势不变
5. 保持物体位置、角度、大小和遮挡关系
6. 主体要自然融入新场景
7. 匹配新场景的：
   - 透视关系
   - 光线方向和强度
   - 色温
   - 阴影
   - 环境反光
   - 景深效果
8. 主体边缘要自然融合
9. 避免以下问题：抠图感、拼贴感、硬边、白边、黑边、光晕、合成痕迹

【输出要求】
生成一张自然真实的照片级图片，看起来像真实拍摄。`;
}

function buildReplaceBothPrompt(
  template: TemplateItem,
  hasHandImage: boolean,
  hasSceneImage: boolean
): string {
  let handRef = hasHandImage ? '用户上传的手部参考图' : '原模板手部';
  let sceneRef = hasSceneImage ? '用户上传的场景参考图' : '原模板场景';

  return `图片编辑任务：同时替换手部和背景

【模板信息】
- 模板名称：${template.name}
- 主体：${template.mainSubject}
- 描述：${template.description}

【参考资料】
- 手部参考：${handRef}
- 场景参考：${sceneRef}

【核心要求】
1. 手部参考${hasHandImage ? '用户上传的手部图' : '使用模板手部'}
2. 背景参考${hasSceneImage ? '用户上传的场景图' : '使用模板背景'}
3. 模板负责提供：
   - 主体构图
   - 物体位置
   - 拍摄角度
4. 物体（苹果笔、手机、杯子等）保持模板中的位置和姿态
5. 结果必须像真实拍摄的照片
6. 保持物体上的文字和标识清晰准确
7. 匹配整体光线、阴影、透视、色彩和景深
8. 手部与物体接触关系自然
9. 避免AI感和合成痕迹

【输出要求】
生成一张自然真实的照片级图片，看起来像真实拍摄。`;
}

export function buildOptimizationPrompt(optimizeType: OptimizeType, currentPrompt: string): string {
  const optimizationPrompts: Record<OptimizeType, string> = {
    'fix-hand-edges': `优化手部边缘：
- 修复手部边缘的硬边、白边或黑边
- 使手部与背景/物体之间的过渡更自然
- 消除抠图感
- 匹配周围环境的光线和阴影
${currentPrompt}`,

    'enhance-realism': `增强真实感：
- 优化整体光影关系
- 改善皮肤质感和纹理
- 增加环境细节
- 消除AI合成痕迹
- 匹配场景的色调和氛围
${currentPrompt}`,

    'optimize-subject-blend': `优化主体融合：
- 使主体与背景的颜色、光线更协调
- 改善主体边缘的过渡
- 优化前景、中景、背景的关系
- 增加自然的虚实关系
${currentPrompt}`,

    'optimize-background-blend': `优化背景融合：
- 使背景更自然协调
- 改善前景与背景的衔接
- 优化背景的透视关系
- 增加环境真实感
${currentPrompt}`,

    'fix-hand-object-contact': `修复手和物体接触关系：
- 优化手部握住物体的姿态
- 改善手指与物体接触处的阴影
- 使手部与物体之间的遮挡关系更自然
- 消除接触处的生硬边界
${currentPrompt}`,

    'reduce-ai-feel': `降低AI感：
- 增加自然的纹理和细节
- 优化不自然的光线或阴影
- 改善整体色调
- 增加真实照片的噪点感和质感
- 消除合成痕迹
${currentPrompt}`,
  };

  return optimizationPrompts[optimizeType] || currentPrompt;
}
