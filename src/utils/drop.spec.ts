import { describe, expect, it } from 'vitest'
import { createUniNode } from '@/modes/uniapp/factory'
import { computeDropSlot, getFlexAxis, isRowContainer } from './drop'
import type { DropHit } from '@/types/editor'

function rect(left: number, top: number, width: number, height: number) {
  return { left, top, width, height, right: left + width, bottom: top + height }
}

describe('getFlexAxis / isRowContainer', () => {
  it('treats row and row-reverse as horizontal', () => {
    expect(getFlexAxis({ flexDirection: 'row' })).toBe('x')
    expect(getFlexAxis({ flexDirection: 'column' })).toBe('y')
    const row = createUniNode('row')
    expect(isRowContainer(row)).toBe(true)
    expect(isRowContainer(createUniNode('view'))).toBe(false)
  })
})

describe('computeDropSlot', () => {
  it('drops inside an empty root', () => {
    const hit: DropHit = { id: 'root', rect: rect(0, 0, 300, 600), children: [] }
    expect(computeDropSlot({ nodes: [], hit, x: 40, y: 40 })).toMatchObject({
      parentId: null,
      index: 0,
      placement: 'inside',
      refId: 'root',
    })
  })

  it('inserts before / after stacked root children', () => {
    const a = createUniNode('text')
    const b = createUniNode('button')
    const nodes = [a, b]
    const hit: DropHit = {
      id: 'root',
      rect: rect(0, 0, 300, 600),
      children: [
        { id: a.id, rect: rect(0, 0, 300, 40) },
        { id: b.id, rect: rect(0, 50, 300, 44) },
      ],
    }
    expect(computeDropSlot({ nodes, hit, x: 20, y: 10 })?.index).toBe(0)
    expect(computeDropSlot({ nodes, hit, x: 20, y: 80 })?.index).toBe(2)
  })

  it('uses horizontal midpoints inside a row container', () => {
    const row = createUniNode('row')
    const left = createUniNode('button')
    const right = createUniNode('button')
    row.children = [left, right]
    const hit: DropHit = {
      id: row.id,
      rect: rect(0, 0, 300, 50),
      children: [
        { id: left.id, rect: rect(0, 0, 140, 44) },
        { id: right.id, rect: rect(150, 0, 140, 44) },
      ],
    }
    const before = computeDropSlot({ nodes: [row], hit, x: 40, y: 20 })
    expect(before).toMatchObject({ parentId: row.id, index: 0, placement: 'before', axis: 'x' })
    const after = computeDropSlot({ nodes: [row], hit, x: 260, y: 20 })
    expect(after).toMatchObject({ parentId: row.id, index: 2, placement: 'after', axis: 'x' })
  })

  it('places beside a leaf using the parent axis', () => {
    const row = createUniNode('row')
    const left = createUniNode('text')
    row.children = [left]
    const hit: DropHit = { id: left.id, rect: rect(0, 0, 100, 30), children: [] }
    const after = computeDropSlot({ nodes: [row], hit, x: 80, y: 10 })
    expect(after).toMatchObject({ parentId: row.id, index: 1, placement: 'after', axis: 'x' })
  })

  it('rejects dropping a node into itself or its descendants', () => {
    const view = createUniNode('view')
    const child = createUniNode('text')
    view.children = [child]
    const hitSelf: DropHit = { id: view.id, rect: rect(0, 0, 200, 80), children: [] }
    expect(computeDropSlot({ nodes: [view], hit: hitSelf, x: 10, y: 10, draggingNodeId: view.id })).toBeNull()
    const hitChild: DropHit = { id: child.id, rect: rect(0, 0, 100, 20), children: [] }
    expect(computeDropSlot({ nodes: [view], hit: hitChild, x: 10, y: 10, draggingNodeId: view.id })).toBeNull()
  })
})
