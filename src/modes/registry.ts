import type { GeneratorMode } from '@/types/editor'
import { uniappMode } from './uniapp'

export const upcomingModes: GeneratorMode[] = [
  {
    id: 'taro',
    name: 'Taro',
    tagline: '即将推出',
    description: '后续将支持 Taro 语法与目录结构，当前版本请使用 UniApp 模式。',
    available: false,
    accent: '#0f172a',
    blocks: [],
    createNode: () => {
      throw new Error('Taro 模式尚未开放')
    },
    createExample: () => {
      throw new Error('Taro 模式尚未开放')
    },
    generateProject: () => {
      throw new Error('Taro 模式尚未开放')
    },
  },
]

export const allModes: GeneratorMode[] = [uniappMode, ...upcomingModes]

export function getMode(id: string): GeneratorMode | undefined {
  return allModes.find((mode) => mode.id === id)
}

export function getAvailableModes(): GeneratorMode[] {
  return allModes.filter((mode) => mode.available)
}
