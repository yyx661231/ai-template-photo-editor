// components/GeneratePanel.tsx

import { EditMode, TemplateItem } from '@/lib/types';

interface GeneratePanelProps {
  mode: EditMode | null;
  template: TemplateItem | null;
  handImage: string | null;
  sceneImage: string | null;
  onGenerate: () => void;
  isGenerating: boolean;
  currentStep: number;
}

export default function GeneratePanel({
  mode,
  template,
  handImage,
  sceneImage,
  onGenerate,
  isGenerating,
  currentStep,
}: GeneratePanelProps) {
  const steps = [
    { text: '正在分析模板', duration: 400 },
    { text: '正在匹配参考图片', duration: 300 },
    { text: '正在生成编辑提示词', duration: 300 },
    { text: '正在融合光线和阴影', duration: 300 },
    { text: '正在优化边缘', duration: 200 },
  ];

  const canGenerate = () => {
    if (!mode || !template || isGenerating) return false;

    switch (mode) {
      case 'replace-hand':
        return !!handImage;
      case 'replace-background':
        return !!sceneImage;
      case 'replace-both':
        return !!handImage && !!sceneImage;
      default:
        return false;
    }
  };

  const getValidationMessage = () => {
    if (!mode) return '请先选择编辑模式';
    if (!template) return '请先选择模板';
    switch (mode) {
      case 'replace-hand':
        return handImage ? '可以开始生成' : '请上传手部参考图';
      case 'replace-background':
        return sceneImage ? '可以开始生成' : '请上传场景参考图';
      case 'replace-both':
        if (!handImage && !sceneImage) return '请上传手部参考图和场景参考图';
        if (!handImage) return '请上传手部参考图';
        if (!sceneImage) return '请上传场景参考图';
        return '可以开始生成';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-surface-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-surface-900">生成图片</h2>
        <span
          className={`text-sm ${
            canGenerate() ? 'text-green-600' : 'text-surface-400'
          }`}
        >
          {getValidationMessage()}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              isGenerating
                ? 'bg-primary-100 text-primary-600'
                : canGenerate()
                ? 'bg-green-100 text-green-600'
                : 'bg-surface-100 text-surface-400'
            }`}
          >
            {isGenerating ? (
              <span className="animate-spin">⟳</span>
            ) : canGenerate() ? (
              '✓'
            ) : (
              '1'
            )}
          </div>
          <span className="text-sm text-surface-600">
            {isGenerating ? steps[currentStep]?.text || '处理中...' : '点击生成按钮开始'}
          </span>
        </div>

        {isGenerating && (
          <div className="ml-4 pl-7 border-l-2 border-primary-200 space-y-2 py-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 text-sm transition-opacity duration-300 ${
                  index <= currentStep
                    ? 'text-primary-600 opacity-100'
                    : 'text-surface-300 opacity-50'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    index < currentStep
                      ? 'bg-primary-500'
                      : index === currentStep
                      ? 'bg-primary-400 animate-pulse-soft'
                      : 'bg-surface-300'
                  }`}
                />
                {step.text}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onGenerate}
        disabled={!canGenerate()}
        className={`w-full py-3.5 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
          canGenerate()
            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40'
            : 'bg-surface-100 text-surface-400 cursor-not-allowed'
        }`}
      >
        {isGenerating ? (
          <>
            <span className="animate-spin">⟳</span>
            生成中...
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            开始生成
          </>
        )}
      </button>
    </div>
  );
}
