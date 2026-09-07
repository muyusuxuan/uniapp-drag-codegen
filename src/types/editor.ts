export type BlockType =
  | 'view'
  | 'scroll-view'
  | 'text'
  | 'button'
  | 'image'
  | 'input'
  | 'swiper'
  | 'navigator'
  | 'tab-bar'

export interface NodeStyle {
  width?: string
  height?: string
  padding?: string
  margin?: string
  backgroundColor?: string
  color?: string
  fontSize?: string
  fontWeight?: string
  textAlign?: string
  lineHeight?: string
  borderRadius?: string
  border?: string
  display?: string
  flexDirection?: string
  justifyContent?: string
  alignItems?: string
  gap?: string
  overflow?: string
}

export interface CanvasNode {
  id: string
  type: Exclude<BlockType, 'tab-bar'>
  name: string
  props: Record<string, string>
  style: NodeStyle
  children?: CanvasNode[]
}

export interface TabBarItem {
  id: string
  text: string
  pageKey: string
}

export interface TabBarConfig {
  enabled: boolean
  color: string
  selectedColor: string
  backgroundColor: string
  list: TabBarItem[]
}

export interface PageMeta {
  title: string
  backgroundColor: string
  navigationBarBackgroundColor: string
  navigationBarTextStyle: 'white' | 'black'
}

export interface EditorDocument {
  projectName: string
  modeId: string
  page: PageMeta
  nodes: CanvasNode[]
  tabBar: TabBarConfig
}

export type Selection =
  | { kind: 'page' }
  | { kind: 'tabBar' }
  | { kind: 'node'; id: string }
  | null

export interface BlockDefinition {
  type: BlockType
  label: string
  hint: string
  icon: string
  category: 'layout' | 'basic' | 'structure'
  canHaveChildren?: boolean
}

export interface ProjectFile {
  path: string
  content: string
  encoding?: 'utf8' | 'base64'
}

export interface GeneratorMode {
  id: string
  name: string
  tagline: string
  description: string
  available: boolean
  accent: string
  blocks: BlockDefinition[]
  createNode: (type: Exclude<BlockType, 'tab-bar'>) => CanvasNode
  createExample: () => Pick<EditorDocument, 'page' | 'nodes' | 'tabBar'>
  generateProject: (doc: EditorDocument) => ProjectFile[]
}
