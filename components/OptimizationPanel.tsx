// components/OptimizationPanel.tsx

import { OptimizeType } from '@/lib/types';

interface OptimizationPanelProps {
  onOptimize: (type: OptimizeType) => void;
  isOptimizing: boolean;
  disabled: boolean;
}

const optimizationOptions: {
  type: OptimizeType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    type: 'fix-hand-edges',
    label: '修复手部边缘',
    description: '消除硬边、白边、黑边',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
        />
      </svg>
    ),
  },
  {
    type: 'enhance-realism',
    label: '增强真实感',
    description: '改善光影和材质质感',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
  },
  {
    type: 'optimize-subject-blend',
    label: '优化主体融合',
    description: '使主体与背景协调自然',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
        />
      </svg>
    ),
  },
  {
    type: 'optimize-background-blend',
    label: '优化背景融合',
    description: '改善背景的透视和衔接',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    type: 'fix-hand-object-contact',
    label: '修复手物接触',
    description: '优化手指与物体的关系',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
        />
      </svg>
    ),
  },
  {
    type: 'reduce-ai-feel',
    label: '降低 AI 感',
    description: '消除合成痕迹和 AI 感',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
  },
];

export default function OptimizationPanel({
  onOptimize,
  isOptimizing,
  disabled,
}: OptimizationPanelProps) {
  if (disabled) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-surface-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-surface-900">二次优化</h3>
        {isOptimizing && (
          <span className="text-sm text-primary-500 animate-pulse-soft">
            优化中...
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {optimizationOptions.map((option) => (
          <button
            key={option.type}
            onClick={() => onOptimize(option.type)}
            disabled={isOptimizing}
            className={`p-3 rounded-xl border transition-all duration-200 text-left ${
              isOptimizing
                ? 'border-surface-200 bg-surface-50 cursor-not-allowed opacity-50'
                : 'border-surface-200 hover:border-primary-300 hover:bg-primary-50 active:scale-[0.98]'
            }`}
          >
            <div
              className={`mb-2 ${
                isOptimizing ? 'text-surface-300' : 'text-primary-500'
              }`}
            >
              {option.icon}
            </div>
            <h4
              className={`font-medium text-sm ${
                isOptimizing ? 'text-surface-400' : 'text-surface-900'
              }`}
            >
              {option.label}
            </h4>
            <p
              className={`text-xs mt-0.5 ${
                isOptimizing ? 'text-surface-300' : 'text-surface-500'
              }`}
            >
              {option.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
