// components/ResultPanel.tsx

interface ResultPanelProps {
  resultImageUrl: string | null;
  prompt: string;
  onDownload: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
}

export default function ResultPanel({
  resultImageUrl,
  prompt,
  onDownload,
  onRegenerate,
  isLoading,
}: ResultPanelProps) {
  if (!resultImageUrl && !isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-surface-200 p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-surface-100 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-surface-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-surface-900 mb-2">
          等待生成结果
        </h3>
        <p className="text-sm text-surface-500">
          选择模式、模板并上传参考图片后，点击生成按钮
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-surface-200 p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary-100 flex items-center justify-center mb-4 animate-pulse-soft">
          <svg
            className="w-8 h-8 text-primary-500 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-surface-900 mb-2">
          正在生成图片
        </h3>
        <p className="text-sm text-surface-500">
          请稍候，AI 正在处理您的图片...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
      <div className="p-4 border-b border-surface-100 flex items-center justify-between">
        <h3 className="font-semibold text-surface-900">生成结果</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onRegenerate}
            className="px-4 py-2 text-sm font-medium text-surface-600 hover:text-surface-900 hover:bg-surface-100 rounded-lg transition-colors"
          >
            重新生成
          </button>
          <button
            onClick={onDownload}
            className="px-4 py-2 text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            下载
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="aspect-video bg-surface-100 rounded-xl overflow-hidden mb-4">
          <img
            src={resultImageUrl || ''}
            alt="生成结果"
            className="w-full h-full object-contain"
          />
        </div>

        {prompt && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-surface-700">使用的 Prompt</h4>
            <div className="bg-surface-50 rounded-xl p-4">
              <pre className="text-xs text-surface-600 whitespace-pre-wrap font-mono leading-relaxed">
                {prompt}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
