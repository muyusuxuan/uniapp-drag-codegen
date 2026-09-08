<script setup lang="ts">
import type { CanvasNode } from '@/types/editor'
import { useEditorStore } from '@/store/editor'
import { canHaveChildren, findParent } from '@/utils/tree'
import { getFlexAxis } from '@/utils/drop'
import { nodeDragValue } from '@/utils/dnd'

defineOptions({ name: 'NodeTreeList' })

defineProps<{
  nodes: CanvasNode[]
  depth: number
}>()

const store = useEditorStore()

function selected(id: string) {
  return store.selection?.kind === 'node' && store.selection.id === id
}

function dropOn(id: string) {
  const slot = store.hoverDropSlot
  return slot?.refId === id
}

function onDragStart(event: DragEvent, id: string) {
  if (!event.dataTransfer) return
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', nodeDragValue(id))
  store.draggingNodeId = id
  store.draggingType = null
}

function onDragOver(event: DragEvent, node: CanvasNode) {
  event.preventDefault()
  event.stopPropagation()
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const loc = findParent(store.doc.nodes, node.id)
  if (canHaveChildren(node.type) && event.clientY > rect.top + 10 && event.clientY < rect.bottom - 10) {
    store.hoverDropSlot = {
      parentId: node.id,
      index: node.children?.length ?? 0,
      placement: 'inside',
      refId: node.id,
      axis: getFlexAxis(node.style),
    }
    return
  }
  const after = event.clientY > rect.top + rect.height / 2
  store.hoverDropSlot = {
    parentId: loc?.parent?.id ?? null,
    index: loc ? (after ? loc.index + 1 : loc.index) : 0,
    placement: after ? 'after' : 'before',
    refId: node.id,
    axis: 'y',
  }
}

function onDrop(event: DragEvent, node: CanvasNode) {
  event.preventDefault()
  event.stopPropagation()
  onDragOver(event, node)
  store.dropOn(node.id, event)
}

function onDragEnd() {
  if (store.draggingNodeId || store.hoverDropSlot) store.cancelDrag()
}
</script>

<template>
  <ul class="rows">
    <li v-for="node in nodes" :key="node.id">
      <button
        type="button"
        class="row"
        :class="{
          on: selected(node.id),
          nest: canHaveChildren(node.type),
          drop: dropOn(node.id),
        }"
        :style="{ paddingLeft: `${8 + depth * 12}px` }"
        draggable="true"
        @click="store.select({ kind: 'node', id: node.id })"
        @dragstart="onDragStart($event, node.id)"
        @dragover="onDragOver($event, node)"
        @drop="onDrop($event, node)"
        @dragend="onDragEnd"
      >
        <span>{{ node.name }}</span>
        <small>{{ node.props.text || node.type }}</small>
      </button>
      <NodeTreeList v-if="node.children?.length" :nodes="node.children" :depth="depth + 1" />
    </li>
  </ul>
</template>

<style scoped>
.rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
li { display: flex; flex-direction: column; gap: 4px; }
.row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  text-align: left;
  font-size: 12px;
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 8px;
  padding: 6px 8px;
}
.row.on { border-color: var(--accent); background: var(--accent-soft); }
.row.nest { border-style: dashed; }
.row.drop { border-color: var(--ok); background: rgba(7, 193, 96, 0.08); }
small { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 42%; }
</style>
