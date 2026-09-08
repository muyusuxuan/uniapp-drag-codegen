import { describe, expect, it } from 'vitest'
import { createUniNode } from '@/modes/uniapp/factory'
import { findNode, insertNode, moveNodeInTree, removeNode } from '@/utils/tree'

describe('tree helpers', () => {
  it('inserts into a container and can find / remove the child', () => {
    const view = createUniNode('view')
    const nodes = [view]
    const text = createUniNode('text')
    insertNode(nodes, text, view.id)
    expect(findNode(nodes, text.id)?.type).toBe('text')
    expect(view.children).toHaveLength(1)
    removeNode(nodes, text.id)
    expect(findNode(nodes, text.id)).toBeNull()
    expect(view.children).toHaveLength(0)
  })

  it('reorders and reparents inside a row without losing the node', () => {
    const row = createUniNode('row')
    const a = createUniNode('text')
    const b = createUniNode('button')
    const c = createUniNode('image')
    row.children = [a, b, c]
    const nodes = [row]
    expect(moveNodeInTree(nodes, a.id, row.id, 3)).toBe(true)
    expect(row.children?.map((n) => n.id)).toEqual([b.id, c.id, a.id])

    const view = createUniNode('view')
    nodes.push(view)
    expect(moveNodeInTree(nodes, b.id, view.id, 0)).toBe(true)
    expect(row.children?.map((n) => n.id)).toEqual([c.id, a.id])
    expect(view.children?.map((n) => n.id)).toEqual([b.id])
  })

  it('does not insert into a leaf', () => {
    const text = createUniNode('text')
    const nodes = [text]
    const btn = createUniNode('button')
    expect(insertNode(nodes, btn, text.id)).toBe(false)
  })
})
