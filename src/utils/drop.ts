import type { CanvasNode, DropHit, DropSlot, NodeStyle, RectLike } from '@/types/editor'
import { canHaveChildren, findNode, findParent, isDescendant } from './tree'

export function toRectLike(rect: {
  left: number
  top: number
  width: number
  height: number
  right: number
  bottom: number
}): RectLike {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    right: rect.right,
    bottom: rect.bottom,
  }
}

export function getFlexAxis(style?: Pick<NodeStyle, 'flexDirection'> | null): 'x' | 'y' {
  const dir = style?.flexDirection
  return dir === 'row' || dir === 'row-reverse' ? 'x' : 'y'
}

export function isRowContainer(node: CanvasNode | null | undefined): boolean {
  if (!node) return false
  return node.type === 'row' || getFlexAxis(node.style) === 'x'
}

function indexAlongAxis(
  children: DropHit['children'],
  axis: 'x' | 'y',
  x: number,
  y: number,
): { index: number; refId: string; placement: 'before' | 'after' } {
  const pos = axis === 'x' ? x : y
  for (let i = 0; i < children.length; i += 1) {
    const child = children[i]
    const mid = axis === 'x' ? child.rect.left + child.rect.width / 2 : child.rect.top + child.rect.height / 2
    if (pos < mid) {
      return { index: i, refId: child.id, placement: 'before' }
    }
  }
  const last = children[children.length - 1]
  return { index: children.length, refId: last.id, placement: 'after' }
}

function parentAxis(nodes: CanvasNode[], parentId: string | null): 'x' | 'y' {
  if (!parentId) return 'y'
  const parent = findNode(nodes, parentId)
  return getFlexAxis(parent?.style)
}

export function computeDropSlot(params: {
  nodes: CanvasNode[]
  hit: DropHit | null
  x: number
  y: number
  draggingNodeId?: string | null
}): DropSlot | null {
  const { nodes, hit, x, y, draggingNodeId } = params
  if (!hit) return null

  if (draggingNodeId) {
    const dragging = findNode(nodes, draggingNodeId)
    if (dragging && hit.id !== 'root' && (hit.id === draggingNodeId || isDescendant(dragging, hit.id))) {
      return null
    }
  }

  if (hit.id === 'root') {
    if (!hit.children.length) {
      return { parentId: null, index: 0, placement: 'inside', refId: 'root', axis: 'y' }
    }
    const slot = indexAlongAxis(hit.children, 'y', x, y)
    return { parentId: null, index: slot.index, placement: slot.placement, refId: slot.refId, axis: 'y' }
  }

  const node = findNode(nodes, hit.id)
  if (!node) return null

  if (canHaveChildren(node.type)) {
    const axis = getFlexAxis(node.style)
    if (!hit.children.length) {
      return { parentId: node.id, index: 0, placement: 'inside', refId: node.id, axis }
    }
    const slot = indexAlongAxis(hit.children, axis, x, y)
    return {
      parentId: node.id,
      index: slot.index,
      placement: slot.placement,
      refId: slot.refId,
      axis,
    }
  }

  const loc = findParent(nodes, node.id)
  if (!loc) return null
  const axis = parentAxis(nodes, loc.parent?.id ?? null)
  const pos = axis === 'x' ? x : y
  const mid = axis === 'x' ? hit.rect.left + hit.rect.width / 2 : hit.rect.top + hit.rect.height / 2
  const after = pos >= mid
  return {
    parentId: loc.parent?.id ?? null,
    index: after ? loc.index + 1 : loc.index,
    placement: after ? 'after' : 'before',
    refId: node.id,
    axis,
  }
}
