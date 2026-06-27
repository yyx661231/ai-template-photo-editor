// components/ImageUploader.tsx

import { useState, useRef } from 'react';

interface ImageUploaderProps {
  label: string;
  description?: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
}

export default function ImageUploader({
  label,
  description,
  value,
  onChange,
  disabled = false,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-surface-900">{label}</h3>
          {description && <p className="text-sm text-surface-500">{description}</p>}
        </div>
        {value && (
          <button
            onClick={handleClear}
            className="text-sm text-red-500 hover:text-red-600 transition-colors"
          >
            清除
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer ${
          disabled
            ? 'border-surface-200 bg-surface-50 cursor-not-allowed opacity-60'
            : isDragging
            ? 'border-primary-400 bg-primary-50'
            : value
            ? 'border-surface-300 bg-surface-50'
            : 'border-surface-300 hover:border-primary-300 hover:bg-primary-50/50'
        }`}
      >
        {value ? (
          <div className="relative aspect-video rounded-xl overflow-hidden m-2">
            <img
              src={value}
              alt="上传预览"
              className="w-full h-full object-contain bg-surface-100"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="opacity-0 hover:opacity-100 transition-opacity text-white text-sm bg-black/50 px-3 py-1.5 rounded-lg">
                点击更换图片
              </span>
            </div>
          </div>
        ) : (
          <div className="py-10 px-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6 text-surface-400"
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
            <p className="text-sm text-surface-600 mb-1">
              <span className="text-primary-500 font-medium">点击上传</span> 或拖拽图片
            </p>
            <p className="text-xs text-surface-400">支持 JPG、PNG、WebP 格式</p>
          </div>
        )}
      </div>
    </div>
  );
}
