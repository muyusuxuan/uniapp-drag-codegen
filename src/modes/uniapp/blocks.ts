import type { BlockDefinition } from '@/types/editor'

export const UNIAPP_BLOCKS: BlockDefinition[] = [
  {
    type: 'view',
    label: '容器',
    hint: '可嵌套的布局容器',
    icon: '▢',
    category: 'layout',
    canHaveChildren: true,
  },
  {
    type: 'scroll-view',
    label: '滚动容器',
    hint: '可滚动的内容区域',
    icon: '⇅',
    category: 'layout',
    canHaveChildren: true,
  },
  {
    type: 'text',
    label: '文本',
    hint: '标题或正文',
    icon: 'T',
    category: 'basic',
  },
  {
    type: 'button',
    label: '按钮',
    hint: '可点击操作',
    icon: '●',
    category: 'basic',
  },
  {
    type: 'image',
    label: '图片',
    hint: '图片占位',
    icon: '▣',
    category: 'basic',
  },
  {
    type: 'input',
    label: '输入框',
    hint: '单行输入',
    icon: '▭',
    category: 'basic',
  },
  {
    type: 'swiper',
    label: '轮播',
    hint: '图片轮播图',
    icon: '↔',
    category: 'structure',
  },
  {
    type: 'navigator',
    label: '跳转单元格',
    hint: '页面跳转行',
    icon: '→',
    category: 'structure',
  },
  {
    type: 'tab-bar',
    label: '底部标签栏',
    hint: '多 Tab 页面结构',
    icon: '▁',
    category: 'structure',
  },
]
