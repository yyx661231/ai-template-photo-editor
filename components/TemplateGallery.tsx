'use client';

import { useState } from 'react';
import { TemplateItem, EditMode } from '@/lib/types';

interface TemplateGalleryProps {
  templates: TemplateItem[];
  selectedTemplateId: string | null;
  selectedMode: EditMode | null;
  onTemplateSelect: (template: TemplateItem) => void;
}

export default function TemplateGallery({
  templates,
  selectedTemplateId,
  selectedMode,
  onTemplateSelect,
}: TemplateGalleryProps) {
  const availableTemplates =
    selectedMode === null
      ? templates
      : templates.filter((t) => t.supportedModes.includes(selectedMode));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-surface-900">选择模板</h2>
      {selectedMode && (
        <p className="text-sm text-surface-500">
          当前模式支持 {availableTemplates.length} 个模板
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {availableTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateSelect(template)}
            className={`relative group rounded-2xl overflow-hidden transition-all duration-200 ${
              selectedTemplateId === template.id
                ? 'ring-4 ring-primary-500 shadow-lg scale-[1.02]'
                : 'hover:shadow-md hover:scale-[1.01]'
            }`}
          >
            <div className="aspect-[4/3] bg-surface-100 relative">
              <TemplateImage
                src={template.thumbnail}
                alt={template.name}
              />
              {selectedTemplateId === template.id && (
                <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 bg-white">
              <h3 className="font-medium text-surface-900 text-sm truncate">
                {template.name}
              </h3>
              <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">
                {template.description}
              </p>
            </div>
          </button>
        ))}
      </div>
      {availableTemplates.length === 0 && selectedMode && (
        <div className="text-center py-8 text-surface-500">
          <p>当前模式下没有可用的模板</p>
        </div>
      )}
    </div>
  );
}

function TemplateImage({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (!hasError) {
    return (
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-100 to-surface-200">
      <div className="text-center">
        <svg
          className="w-12 h-12 mx-auto text-surface-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-xs text-surface-400 mt-2 max-w-[100px] mx-auto">
          {alt}
        </p>
      </div>
    </div>
  );
}
