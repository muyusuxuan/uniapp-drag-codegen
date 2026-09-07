import type { BlockType } from '@/types/editor'

export const BLOCK_TYPES: BlockType[] = [
  'view',
  'scroll-view',
  'text',
  'button',
  'image',
  'input',
  'swiper',
  'navigator',
  'tab-bar',
]

export function isBlockType(value: string): value is BlockType {
  return (BLOCK_TYPES as string[]).includes(value)
}

export function blockDragValue(type: BlockType): string {
  return `block:${type}`
}

export function nodeDragValue(id: string): string {
  return `node:${id}`
}

export function parseDragValue(raw: string): { kind: 'block'; type: BlockType } | { kind: 'node'; id: string } | null {
  if (raw.startsWith('block:')) {
    const type = raw.slice(6)
    if (isBlockType(type)) return { kind: 'block', type }
    return null
  }
  if (raw.startsWith('node:')) {
    const id = raw.slice(5)
    return id ? { kind: 'node', id } : null
  }
  if (isBlockType(raw)) return { kind: 'block', type: raw }
  if (raw) return { kind: 'node', id: raw }
  return null
}

export function allowDrop(event: DragEvent, dropEffect: 'copy' | 'move' = 'copy'): void {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = dropEffect
}
