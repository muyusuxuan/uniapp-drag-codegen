import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { BlockType, CanvasNode, DropHit, DropSlot, EditorDocument, Selection } from '@/types/editor'
import { getMode } from '@/modes/registry'
import { cloneJson, uid } from '@/utils/helpers'
import { canHaveChildren, findNode, findParent, insertNode, moveNodeInTree, removeNode } from '@/utils/tree'
import { defaultPage, defaultTabBar } from '@/modes/uniapp/factory'
import { parseDragValue, isBlockType } from '@/utils/dnd'
import { computeDropSlot, getFlexAxis, isRowContainer, toRectLike } from '@/utils/drop'

const STORAGE_PREFIX = 'uni-codegen-doc:'

export type ResizeEdge = 'e' | 's' | 'se'

export interface ResizeState {
  id: string
  edge: ResizeEdge
  startX: number
  startY: number
  startW: number
  startH: number
}

function emptyDoc(modeId: string): EditorDocument {
  return {
    projectName: 'uni-generated-app',
    modeId,
    page: defaultPage(),
    nodes: [],
    tabBar: defaultTabBar(),
  }
}

function loadDoc(modeId: string): EditorDocument {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + modeId)
    if (!raw) return emptyDoc(modeId)
    const parsed = JSON.parse(raw) as EditorDocument
    if (parsed && parsed.modeId === modeId && Array.isArray(parsed.nodes)) return parsed
  } catch {
    /* ignore corrupt cache */
  }
  return emptyDoc(modeId)
}

function collectChildHits(el: HTMLElement): DropHit['children'] {
  const children: DropHit['children'] = []
  el.querySelectorAll<HTMLElement>(':scope > [data-node-id]').forEach((child) => {
    const id = child.dataset.nodeId
    if (!id) return
    children.push({ id, rect: toRectLike(child.getBoundingClientRect()) })
  })
  return children
}

export const useEditorStore = defineStore('editor', () => {
  const doc = ref<EditorDocument>(emptyDoc('uniapp'))
  const selection = ref<Selection>({ kind: 'page' })
  const draggingType = ref<BlockType | null>(null)
  const draggingNodeId = ref<string | null>(null)
  const hoverDropSlot = ref<DropSlot | null>(null)
  const toast = ref('')
  const pointerDragging = ref(false)
  const ghostX = ref(0)
  const ghostY = ref(0)
  const pressX = ref(0)
  const pressY = ref(0)
  const resizing = ref<ResizeState | null>(null)
  let suppressClick = false

  const mode = computed(() => getMode(doc.value.modeId))
  const selectedNode = computed(() => {
    if (selection.value?.kind !== 'node') return null
    return findNode(doc.value.nodes, selection.value.id)
  })
  const hoverDropId = computed(() => hoverDropSlot.value?.refId ?? null)

  function persist() {
    localStorage.setItem(STORAGE_PREFIX + doc.value.modeId, JSON.stringify(doc.value))
  }

  watch(doc, persist, { deep: true })

  function initMode(modeId: string) {
    const next = getMode(modeId)
    if (!next?.available) return
    doc.value = loadDoc(modeId)
    selection.value = { kind: 'page' }
  }

  function notify(message: string) {
    toast.value = message
    window.setTimeout(() => {
      if (toast.value === message) toast.value = ''
    }, 1800)
  }

  function select(next: Selection) {
    selection.value = next
  }

  function adaptChildForRow(node: CanvasNode) {
    if (node.style.width === '100%' || !node.style.width) {
      node.style.width = 'auto'
      if (!node.style.flex) node.style.flex = '1'
    }
  }

  function adaptNodeForParent(node: CanvasNode, parentId: string | null) {
    if (!parentId) return
    const parent = findNode(doc.value.nodes, parentId)
    if (!parent || !isRowContainer(parent)) return
    adaptChildForRow(node)
  }

  function adaptChildrenToAxis(parent: CanvasNode) {
    if (!parent.children?.length || !isRowContainer(parent)) return
    for (const child of parent.children) adaptChildForRow(child)
  }

  function addNode(type: BlockType, parentId?: string | null, index?: number) {
    const generator = mode.value
    if (!generator) return
    if (type === 'tab-bar') {
      doc.value.tabBar.enabled = true
      if (doc.value.tabBar.list.length < 2) {
        doc.value.tabBar = defaultTabBar()
        doc.value.tabBar.enabled = true
      }
      selection.value = { kind: 'tabBar' }
      notify('已启用底部标签栏')
      return
    }
    const node = generator.createNode(type)
    let targetParent = parentId ?? null
    let targetIndex = index
    if (targetParent == null && index == null && selection.value?.kind === 'node') {
      const current = findNode(doc.value.nodes, selection.value.id)
      if (current && canHaveChildren(current.type)) {
        targetParent = current.id
      } else if (current) {
        const loc = findParent(doc.value.nodes, current.id)
        targetParent = loc?.parent?.id ?? null
        targetIndex = loc ? loc.index + 1 : undefined
      }
    }
    adaptNodeForParent(node, targetParent)
    insertNode(doc.value.nodes, node, targetParent, targetIndex)
    selection.value = { kind: 'node', id: node.id }
    notify(`已添加「${node.name}」`)
  }

  function dropOnSlot(slot: DropSlot, event?: DragEvent) {
    const parsed = parseDragValue(event?.dataTransfer?.getData('text/plain') || '')
    const type = draggingType.value ?? (parsed?.kind === 'block' ? parsed.type : null)
    const movingId = draggingNodeId.value ?? (parsed?.kind === 'node' ? parsed.id : null)
    draggingType.value = null
    draggingNodeId.value = null
    hoverDropSlot.value = null

    if (type) {
      if (type === 'tab-bar') {
        addNode('tab-bar')
        return
      }
      addNode(type, slot.parentId, slot.index)
      return
    }

    if (movingId) {
      moveNode(movingId, slot.parentId, slot.index)
    }
  }

  function dropOn(targetId: string | 'root', event?: DragEvent) {
    if (hoverDropSlot.value) {
      dropOnSlot(hoverDropSlot.value, event)
      return
    }
    if (targetId === 'root') {
      dropOnSlot({ parentId: null, index: doc.value.nodes.length, placement: 'inside', refId: 'root', axis: 'y' }, event)
      return
    }
    const parent = findNode(doc.value.nodes, targetId)
    if (!parent || !canHaveChildren(parent.type)) {
      const loc = findParent(doc.value.nodes, targetId)
      dropOnSlot(
        {
          parentId: loc?.parent?.id ?? null,
          index: loc ? loc.index + 1 : doc.value.nodes.length,
          placement: 'after',
          refId: targetId,
          axis: getFlexAxis(loc?.parent?.style),
        },
        event,
      )
      return
    }
    dropOnSlot(
      {
        parentId: targetId,
        index: parent.children?.length ?? 0,
        placement: 'inside',
        refId: targetId,
        axis: getFlexAxis(parent.style),
      },
      event,
    )
  }

  function moveNode(id: string, parentId: string | null, index?: number) {
    if (!moveNodeInTree(doc.value.nodes, id, parentId, index)) return
    const moved = findNode(doc.value.nodes, id)
    if (moved) adaptNodeForParent(moved, parentId)
    selection.value = { kind: 'node', id }
  }

  function moveSelected(delta: -1 | 1) {
    if (selection.value?.kind !== 'node') return
    const loc = findParent(doc.value.nodes, selection.value.id)
    if (!loc) return
    const next = loc.index + delta
    if (next < 0 || next >= loc.list.length) return
    const [item] = loc.list.splice(loc.index, 1)
    loc.list.splice(next, 0, item)
  }

  function duplicateSelected() {
    if (selection.value?.kind !== 'node') return
    const loc = findParent(doc.value.nodes, selection.value.id)
    if (!loc) return
    const copy = cloneJson(loc.list[loc.index])
    const remap = (node: CanvasNode) => {
      node.id = uid(node.type.replace('-', '').slice(0, 6))
      node.children?.forEach(remap)
    }
    remap(copy)
    loc.list.splice(loc.index + 1, 0, copy)
    selection.value = { kind: 'node', id: copy.id }
  }

  function removeSelected() {
    if (selection.value?.kind === 'tabBar') {
      doc.value.tabBar.enabled = false
      selection.value = { kind: 'page' }
      notify('已移除底部标签栏')
      return
    }
    if (selection.value?.kind !== 'node') return
    removeNode(doc.value.nodes, selection.value.id)
    selection.value = { kind: 'page' }
  }

  function loadExample() {
    const generator = mode.value
    if (!generator) return
    const example = generator.createExample()
    doc.value.page = example.page
    doc.value.nodes = example.nodes
    doc.value.tabBar = example.tabBar
    selection.value = { kind: 'page' }
    notify('已载入示例页面')
  }

  function clearCanvas() {
    doc.value.nodes = []
    doc.value.tabBar = defaultTabBar()
    doc.value.page = defaultPage()
    selection.value = { kind: 'page' }
    notify('画布已清空')
  }

  function updateSelectedStyle<K extends keyof CanvasNode['style']>(key: K, value: string) {
    const node = selectedNode.value
    if (!node) return
    node.style[key] = value
    if (key === 'flexDirection') adaptChildrenToAxis(node)
  }

  function updateSelectedProp(key: string, value: string) {
    const node = selectedNode.value
    if (!node) return
    node.props[key] = value
  }

  function collectHit(el: Element | null): DropHit | null {
    if (!el) return null
    const nodeEl = el.closest('[data-node-id]') as HTMLElement | null
    const rootEl = el.closest('[data-drop-id="root"]') as HTMLElement | null
    if (nodeEl?.dataset.nodeId) {
      return {
        id: nodeEl.dataset.nodeId,
        rect: toRectLike(nodeEl.getBoundingClientRect()),
        children: collectChildHits(nodeEl),
      }
    }
    if (rootEl) {
      return {
        id: 'root',
        rect: toRectLike(rootEl.getBoundingClientRect()),
        children: collectChildHits(rootEl),
      }
    }
    return null
  }

  function resolveSlotFromPoint(x: number, y: number, el?: Element | null): DropSlot | null {
    const hitEl = el ?? document.elementFromPoint(x, y)
    return computeDropSlot({
      nodes: doc.value.nodes,
      hit: collectHit(hitEl),
      x,
      y,
      draggingNodeId: draggingNodeId.value,
    })
  }

  function hoverAt(x: number, y: number, el?: Element | null) {
    hoverDropSlot.value = resolveSlotFromPoint(x, y, el)
  }

  function dropAtPoint(x: number, y: number, event?: DragEvent, el?: Element | null) {
    const slot = resolveSlotFromPoint(x, y, el ?? (event ? document.elementFromPoint(x, y) : null))
    if (slot) dropOnSlot(slot, event)
    else cancelDrag()
  }

  function beginPointer(kind: 'block' | 'node', value: string, x: number, y: number) {
    pointerDragging.value = false
    pressX.value = x
    pressY.value = y
    ghostX.value = x
    ghostY.value = y
    if (kind === 'block' && isBlockType(value)) {
      draggingType.value = value
      draggingNodeId.value = null
    } else if (kind === 'node') {
      draggingNodeId.value = value
      draggingType.value = null
    }
  }

  function movePointer(x: number, y: number, el: Element | null) {
    if (resizing.value) {
      moveResize(x, y)
      return
    }
    if (!draggingType.value && !draggingNodeId.value) return
    ghostX.value = x
    ghostY.value = y
    const dist = Math.hypot(x - pressX.value, y - pressY.value)
    if (dist > 6) pointerDragging.value = true
    if (pointerDragging.value) hoverDropSlot.value = resolveSlotFromPoint(x, y, el)
  }

  function endPointer(el: Element | null) {
    if (resizing.value) {
      endResize()
      return
    }
    const dragged = pointerDragging.value
    const x = ghostX.value
    const y = ghostY.value
    const slot = dragged ? resolveSlotFromPoint(x, y, el) : null
    if (dragged && slot) dropOnSlot(slot)
    else cancelDrag()
    pointerDragging.value = false
    if (dragged) {
      suppressClick = true
      window.setTimeout(() => {
        suppressClick = false
      }, 400)
    }
  }

  function cancelDrag() {
    draggingType.value = null
    draggingNodeId.value = null
    hoverDropSlot.value = null
    pointerDragging.value = false
  }

  function consumeClickSuppressed(): boolean {
    if (!suppressClick) return false
    suppressClick = false
    return true
  }

  function beginResize(id: string, edge: ResizeEdge, x: number, y: number, width: number, height: number) {
    resizing.value = { id, edge, startX: x, startY: y, startW: width, startH: height }
    selection.value = { kind: 'node', id }
  }

  function moveResize(x: number, y: number) {
    const state = resizing.value
    if (!state) return
    const node = findNode(doc.value.nodes, state.id)
    if (!node) return
    const dx = x - state.startX
    const dy = y - state.startY
    if (state.edge === 'e' || state.edge === 'se') {
      node.style.width = `${Math.max(24, Math.round(state.startW + dx))}px`
    }
    if (state.edge === 's' || state.edge === 'se') {
      node.style.height = `${Math.max(16, Math.round(state.startH + dy))}px`
    }
  }

  function endResize() {
    resizing.value = null
  }

  return {
    doc,
    selection,
    draggingType,
    draggingNodeId,
    hoverDropId,
    hoverDropSlot,
    toast,
    pointerDragging,
    ghostX,
    ghostY,
    resizing,
    mode,
    selectedNode,
    initMode,
    select,
    addNode,
    dropOn,
    dropOnSlot,
    dropAtPoint,
    hoverAt,
    moveNode,
    moveSelected,
    duplicateSelected,
    removeSelected,
    loadExample,
    clearCanvas,
    updateSelectedStyle,
    updateSelectedProp,
    beginPointer,
    movePointer,
    endPointer,
    cancelDrag,
    consumeClickSuppressed,
    beginResize,
    moveResize,
    endResize,
    notify,
  }
})
