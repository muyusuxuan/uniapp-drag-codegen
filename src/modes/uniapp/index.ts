import type { GeneratorMode } from '@/types/editor'
import { UNIAPP_BLOCKS } from './blocks'
import { createUniExample, createUniNode } from './factory'
import { generateUniProject } from './generate'

export const uniappMode: GeneratorMode = {
  id: 'uniapp',
  name: 'UniApp',
  tagline: 'Vue3 跨端应用',
  description: '按 uni-app 约定生成页面、pages.json、tabBar 与完整工程目录，可导入 HBuilderX 或用 CLI 运行。',
  available: true,
  accent: '#2b6cff',
  blocks: UNIAPP_BLOCKS,
  createNode: createUniNode,
  createExample: createUniExample,
  generateProject: generateUniProject,
}
