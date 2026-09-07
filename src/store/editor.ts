import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { BlockType, CanvasNode, EditorDocument, Selection } from '@/types/editor'
import { getMode } from '@/modes/registry'
import { cloneJson, uid } from '@/utils/helpers'
import { canHaveChildren, findNode, findParent, insertNode, isDescendant, removeNode } from '@/utils/tree'
import { defaultPage, defaultTabBar } from '@/modes/uniapp/factory'

const STORAGE_PREFIX = 'uni-codegen-doc:'

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

export const useEditorStore = defineStore('editor', () => {
  const doc = ref<EditorDocument>(emptyDoc('uniapp'))
  const selection = ref<Selection>({ kind: 'page' })
  const draggingType = ref<BlockType | null>(null)
  const draggingNodeId = ref<string | null>(null)
  const hoverDropId = ref<string | 'root' | null>(null)
  const toast = ref('')

  const mode = computed(() => getMode(doc.value.modeId))
  const selectedNode = computed(() => {
    if (selection.value?.kind !== 'node') return null
    return findNode(doc.value.nodes, selection.value.id)
  })

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
    if (targetParent == null && selection.value?.kind === 'node') {
      const current = findNode(doc.value.nodes, selection.value.id)
      if (current && canHaveChildren(current.type)) targetParent = current.id
    }
    insertNode(doc.value.nodes, node, targetParent, index)
    selection.value = { kind: 'node', id: node.id }
    notify(`已添加「${node.name}」`)
  }

  function dropOn(targetId: string | 'root') {
    const type = draggingType.value
    const movingId = draggingNodeId.value
    draggingType.value = null
    draggingNodeId.value = null
    hoverDropId.value = null

    if (type) {
      if (type === 'tab-bar') {
        addNode('tab-bar')
        return
      }
      const parentId = targetId === 'root' ? null : targetId
      if (parentId) {
        const parent = findNode(doc.value.nodes, parentId)
        if (!parent || !canHaveChildren(parent.type)) {
          addNode(type, null)
          return
        }
      }
      addNode(type, parentId)
      return
    }

    if (movingId) {
      moveNode(movingId, targetId === 'root' ? null : targetId)
    }
  }

  function moveNode(id: string, parentId: string | null, index?: number) {
    if (id === parentId) return
    const loc = findParent(doc.value.nodes, id)
    if (!loc) return
    const node = loc.list[loc.index]
    if (parentId) {
      const parent = findNode(doc.value.nodes, parentId)
      if (!parent || !canHaveChildren(parent.type) || isDescendant(node, parentId)) return
    }
    loc.list.splice(loc.index, 1)
    insertNode(doc.value.nodes, node, parentId, index)
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
  }

  function updateSelectedProp(key: string, value: string) {
    const node = selectedNode.value
    if (!node) return
    node.props[key] = value
  }

  return {
    doc,
    selection,
    draggingType,
    draggingNodeId,
    hoverDropId,
    toast,
    mode,
    selectedNode,
    initMode,
    select,
    addNode,
    dropOn,
    moveNode,
    moveSelected,
    duplicateSelected,
    removeSelected,
    loadExample,
    clearCanvas,
    updateSelectedStyle,
    updateSelectedProp,
    notify,
  }
})
