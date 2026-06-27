// components/ModeSelector.tsx

import { EditMode } from '@/lib/types';

interface ModeSelectorProps {
  selectedMode: EditMode | null;
  onModeChange: (mode: EditMode) => void;
}

const modes = [
  {
    id: 'replace-hand' as EditMode,
    title: '替换手部',
    description: '保留背景和物体，只替换手部',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    id: 'replace-background' as EditMode,
    title: '替换背景',
    description: '保留主体，只替换背景场景',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    id: 'replace-both' as EditMode,
    title: '同时替换',
    description: '同时替换手部和背景',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
        />
      </svg>
    ),
  },
];

export default function ModeSelector({ selectedMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-surface-900">选择编辑模式</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`relative p-4 rounded-2xl border-2 transition-all duration-200 text-left group hover:shadow-md ${
              selectedMode === mode.id
                ? 'border-primary-500 bg-primary-50 shadow-md'
                : 'border-surface-200 bg-white hover:border-primary-200'
            }`}
          >
            <div
              className={`mb-3 ${
                selectedMode === mode.id ? 'text-primary-600' : 'text-surface-400 group-hover:text-primary-500'
              }`}
            >
              {mode.icon}
            </div>
            <h3
              className={`font-medium mb-1 ${
                selectedMode === mode.id ? 'text-primary-700' : 'text-surface-700'
              }`}
            >
              {mode.title}
            </h3>
            <p className="text-sm text-surface-500">{mode.description}</p>
            {selectedMode === mode.id && (
              <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-primary-500" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
