// app/page.tsx

'use client';

import { useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import ModeSelector from '@/components/ModeSelector';
import TemplateGallery from '@/components/TemplateGallery';
import ImageUploader from '@/components/ImageUploader';
import GeneratePanel from '@/components/GeneratePanel';
import ResultPanel from '@/components/ResultPanel';
import OptimizationPanel from '@/components/OptimizationPanel';
import { templates } from '@/lib/templates';
import {
  EditMode,
  GenerateTaskResponse,
  OptimizeType,
  TaskRecord,
  TemplateItem,
} from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';

function buildApiUrl(path: string) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Home() {
  // 状态管理
  const [selectedMode, setSelectedMode] = useState<EditMode | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [handImage, setHandImage] = useState<string | null>(null);
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [usedPrompt, setUsedPrompt] = useState<string>('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const pollTaskUntilFinished = useCallback(async (taskId: string): Promise<TaskRecord> => {
    while (true) {
      const response = await fetch(buildApiUrl(`/api/tasks/${taskId}`), {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || '任务查询失败');
      }

      const task = data.task as TaskRecord;

      if (task.status === 'completed' || task.status === 'failed') {
        return task;
      }

      await sleep(2000);
    }
  }, []);

  // 生成图片
  const handleGenerate = useCallback(async () => {
    if (!selectedMode || !selectedTemplate) return;

    setIsGenerating(true);
    setCurrentStep(0);
    setResultImageUrl(null);

    // 模拟步骤进度
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= 4) {
          clearInterval(stepInterval);
          return 4;
        }
        return prev + 1;
      });
    }, 300);

    try {
      const response = await fetch(buildApiUrl('/api/generate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: selectedMode,
          templateId: selectedTemplate.id,
          handImage,
          sceneImage,
        }),
      });

      const data = (await response.json()) as GenerateTaskResponse;

      if (data.success) {
        setActiveTaskId(data.taskId);

        const task = await pollTaskUntilFinished(data.taskId);

        if (task.status === 'completed' && task.result) {
          setResultImageUrl(task.result.resultImageUrl);
          setUsedPrompt(task.result.prompt);
        } else {
          throw new Error(task.error || '生成失败');
        }
      } else {
        alert(data.message || '生成失败');
      }
    } catch (error) {
      console.error('Generate error:', error);
      alert('生成失败，请重试');
    } finally {
      clearInterval(stepInterval);
      setIsGenerating(false);
      setCurrentStep(0);
      setActiveTaskId(null);
    }
  }, [selectedMode, selectedTemplate, handImage, sceneImage, pollTaskUntilFinished]);

  // 二次优化
  const handleOptimize = useCallback(
    async (optimizeType: OptimizeType) => {
      if (!resultImageUrl || !usedPrompt) return;

      setIsOptimizing(true);

      try {
        const response = await fetch(buildApiUrl('/api/optimize'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: resultImageUrl,
            optimizeType,
            currentPrompt: usedPrompt,
          }),
        });

        const data = (await response.json()) as GenerateTaskResponse;

        if (data.success) {
          setActiveTaskId(data.taskId);

          const task = await pollTaskUntilFinished(data.taskId);

          if (task.status === 'completed' && task.result) {
            setResultImageUrl(task.result.resultImageUrl);
            setUsedPrompt(task.result.prompt);
          } else {
            throw new Error(task.error || '优化失败');
          }
        } else {
          alert(data.message || '优化失败');
        }
      } catch (error) {
        console.error('Optimize error:', error);
        alert('优化失败，请重试');
      } finally {
        setIsOptimizing(false);
        setActiveTaskId(null);
      }
    },
    [resultImageUrl, usedPrompt, pollTaskUntilFinished]
  );

  // 下载图片
  const handleDownload = useCallback(() => {
    if (!resultImageUrl) return;

    const link = document.createElement('a');
    link.href = resultImageUrl;
    link.download = `ai-photo-${Date.now()}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [resultImageUrl]);

  // 重新生成
  const handleRegenerate = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  // 清除结果
  const handleClearResult = useCallback(() => {
    setResultImageUrl(null);
    setUsedPrompt('');
  }, []);

  // 模式切换时清除不相关的上传
  const handleModeChange = useCallback((mode: EditMode) => {
    setSelectedMode(mode);
    setSelectedTemplate(null);
    setResultImageUrl(null);
    setUsedPrompt('');
    
    // 根据模式清除不需要的上传
    if (mode === 'replace-hand') {
      setSceneImage(null);
    } else if (mode === 'replace-background') {
      setHandImage(null);
    } else if (mode === 'replace-both') {
      // 同时替换模式保留两个上传
    }
  }, []);

  // 模板切换时清除结果
  const handleTemplateSelect = useCallback((template: TemplateItem) => {
    setSelectedTemplate(template);
    setResultImageUrl(null);
    setUsedPrompt('');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* 页面标题 */}
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-3xl font-bold text-surface-900 font-display">
            AI Template Photo Editor
          </h1>
          <p className="text-surface-500 max-w-xl mx-auto">
            基于模板的 AI 图片编辑工具。选择模板，上传参考图片，让 AI 为你生成新照片
          </p>
        </div>

        {/* 主要内容区 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧配置区 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 模式选择 */}
            <div className="animate-slide-up animation-delay-100">
              <ModeSelector
                selectedMode={selectedMode}
                onModeChange={handleModeChange}
              />
            </div>

            {/* 模板选择 */}
            <div className="animate-slide-up animation-delay-200">
              <TemplateGallery
                templates={templates}
                selectedTemplateId={selectedTemplate?.id || null}
                selectedMode={selectedMode}
                onTemplateSelect={handleTemplateSelect}
              />
            </div>

            {/* 上传区域 */}
            {selectedMode && selectedTemplate && (
              <div className="animate-slide-up animation-delay-300 space-y-4">
                <h2 className="text-lg font-semibold text-surface-900">上传参考图片</h2>
                
                {/* 手部图片上传 - 替换手部或同时替换模式 */}
                {(selectedMode === 'replace-hand' || selectedMode === 'replace-both') && (
                  <ImageUploader
                    label="手部参考图"
                    description="上传你的手部照片，用于替换模板中的手部"
                    value={handImage}
                    onChange={setHandImage}
                    disabled={isGenerating || isOptimizing}
                  />
                )}

                {/* 场景图片上传 - 替换背景或同时替换模式 */}
                {(selectedMode === 'replace-background' || selectedMode === 'replace-both') && (
                  <ImageUploader
                    label="场景参考图"
                    description="上传你想要的背景场景，用于替换模板背景"
                    value={sceneImage}
                    onChange={setSceneImage}
                    disabled={isGenerating || isOptimizing}
                  />
                )}
              </div>
            )}
          </div>

          {/* 右侧生成和结果区 */}
          <div className="space-y-6">
            {/* 生成面板 */}
            <div className="animate-slide-up animation-delay-200">
              <GeneratePanel
                mode={selectedMode}
                template={selectedTemplate}
                handImage={handImage}
                sceneImage={sceneImage}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                currentStep={currentStep}
              />
            </div>

            {/* 结果展示 */}
            <div className="animate-slide-up animation-delay-300">
              <ResultPanel
                resultImageUrl={resultImageUrl}
                prompt={usedPrompt}
                onDownload={handleDownload}
                onRegenerate={handleRegenerate}
                isLoading={isGenerating}
              />
            </div>

            {/* 二次优化 */}
            {resultImageUrl && (
              <div className="animate-slide-up animation-delay-400">
                <OptimizationPanel
                  onOptimize={handleOptimize}
                  isOptimizing={isOptimizing}
                  disabled={isGenerating}
                />
              </div>
            )}
          </div>
        </div>

        {/* 底部说明 */}
        <div className="text-center py-8 text-sm text-surface-400 animate-fade-in animation-delay-500">
          <p>
            当前已支持前后端分离部署，前端可通过 `NEXT_PUBLIC_API_BASE_URL` 指向独立 API 服务
          </p>
          <p className="mt-1">
            {activeTaskId
              ? `当前任务 ID：${activeTaskId}`
              : '后端请在香港或新加坡部署，并在服务端环境变量中配置 OPENAI_API_KEY'}
          </p>
        </div>
      </main>
    </div>
  );
}
