import { describe, expect, it } from 'vitest'
import { parseDragValue, blockDragValue, nodeDragValue } from './dnd'

describe('parseDragValue', () => {
  it('parses palette and tree payloads', () => {
    expect(parseDragValue(blockDragValue('button'))).toEqual({ kind: 'block', type: 'button' })
    expect(parseDragValue(nodeDragValue('n_abc'))).toEqual({ kind: 'node', id: 'n_abc' })
    expect(parseDragValue('image')).toEqual({ kind: 'block', type: 'image' })
  })
})
