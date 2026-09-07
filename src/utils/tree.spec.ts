import { describe, expect, it } from 'vitest'
import { createUniNode } from '@/modes/uniapp/factory'
import { findNode, insertNode, removeNode } from '@/utils/tree'

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
})
