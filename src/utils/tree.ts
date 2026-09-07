import type { CanvasNode } from '@/types/editor'

export function findNode(nodes: CanvasNode[], id: string): CanvasNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const hit = findNode(node.children, id)
      if (hit) return hit
    }
  }
  return null
}

export function findParent(
  nodes: CanvasNode[],
  id: string,
  parent: CanvasNode | null = null,
): { parent: CanvasNode | null; index: number; list: CanvasNode[] } | null {
  const index = nodes.findIndex((n) => n.id === id)
  if (index >= 0) return { parent, index, list: nodes }
  for (const node of nodes) {
    if (!node.children) continue
    const hit = findParent(node.children, id, node)
    if (hit) return hit
  }
  return null
}

export function collectIds(node: CanvasNode): string[] {
  const ids = [node.id]
  for (const child of node.children ?? []) ids.push(...collectIds(child))
  return ids
}

export function isDescendant(root: CanvasNode, maybeChildId: string): boolean {
  return collectIds(root).includes(maybeChildId) && root.id !== maybeChildId
}

export function removeNode(nodes: CanvasNode[], id: string): CanvasNode | null {
  const loc = findParent(nodes, id)
  if (!loc) return null
  const [removed] = loc.list.splice(loc.index, 1)
  return removed ?? null
}

export function insertNode(
  nodes: CanvasNode[],
  node: CanvasNode,
  parentId: string | null,
  index?: number,
): boolean {
  if (!parentId) {
    const i = index == null ? nodes.length : Math.max(0, Math.min(index, nodes.length))
    nodes.splice(i, 0, node)
    return true
  }
  const parent = findNode(nodes, parentId)
  if (!parent) return false
  if (!parent.children) parent.children = []
  const i = index == null ? parent.children.length : Math.max(0, Math.min(index, parent.children.length))
  parent.children.splice(i, 0, node)
  return true
}

export function canHaveChildren(type: string): boolean {
  return type === 'view' || type === 'scroll-view'
}

export function flattenNodes(nodes: CanvasNode[]): CanvasNode[] {
  const out: CanvasNode[] = []
  const walk = (list: CanvasNode[]) => {
    for (const node of list) {
      out.push(node)
      if (node.children) walk(node.children)
    }
  }
  walk(nodes)
  return out
}
