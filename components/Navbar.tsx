// components/Navbar.tsx

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-surface-200">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-surface-900 font-display">
                AI Template Photo Editor
              </h1>
              <p className="text-xs text-surface-500">
                基于模板的 AI 图片编辑工具
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-surface-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-soft"></span>
            真实 API 模式
          </div>
        </div>
      </div>
    </nav>
  );
}
