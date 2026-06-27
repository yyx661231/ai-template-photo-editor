// lib/templates.ts

import { TemplateItem } from './types';

/**
 * 模板图片说明：
 * 请将模板图片放在 public/templates/ 目录下
 * 需要以下图片：
 * - template-apple-pencil.jpg (手持苹果笔模板)
 * - template-desk.jpg (桌面工作区模板)
 * 
 * 如果没有真实图片，代码会使用占位符，不会影响运行
 */

export const templates: TemplateItem[] = [
  {
    id: 'apple-pencil',
    name: '手持苹果笔',
    thumbnail: 'https://i.imgs.ovh/2026/06/27/c6feff81628dd14f3b00ef9103932446.jpg',
    imageUrl: 'https://i.imgs.ovh/2026/06/27/c6feff81628dd14f3b00ef9103932446.jpg',
    supportedModes: ['replace-hand', 'replace-background', 'replace-both'],
    mainSubject: '手握苹果笔',
    replaceableAreas: ['hand'],
    description: '一只手握持苹果笔进行书写或绘画的姿势',
    defaultPromptNotes: '保留苹果笔的标志和角度，手部自然握笔姿势',
  },
  {
    id: 'desk-work',
    name: '桌面工作区',
    thumbnail: '/templates/template-desk.jpg',
    imageUrl: '/templates/template-desk.jpg',
    supportedModes: ['replace-hand', 'replace-background', 'replace-both'],
    mainSubject: '桌面物品组合',
    replaceableAreas: ['hand', 'background'],
    description: '包含手机、杯子、文具等的桌面工作场景',
    defaultPromptNotes: '保留桌面物体的位置关系和布局',
  },
];

export function getTemplateById(id: string): TemplateItem | undefined {
  return templates.find(t => t.id === id);
}
