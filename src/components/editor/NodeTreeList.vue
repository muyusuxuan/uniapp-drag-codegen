<script setup lang="ts">
import type { CanvasNode } from '@/types/editor'
import { useEditorStore } from '@/store/editor'
import { canHaveChildren } from '@/utils/tree'

defineOptions({ name: 'NodeTreeList' })

defineProps<{
  nodes: CanvasNode[]
  depth: number
}>()

const store = useEditorStore()

function selected(id: string) {
  return store.selection?.kind === 'node' && store.selection.id === id
}

function onDragStart(event: DragEvent, id: string) {
  if (!event.dataTransfer) return
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', id)
  store.draggingNodeId = id
  store.draggingType = null
}

function onDragOver(event: DragEvent, node: CanvasNode) {
  if (!canHaveChildren(node.type)) return
  event.preventDefault()
  event.stopPropagation()
  store.hoverDropId = node.id
}

function onDrop(event: DragEvent, node: CanvasNode) {
  event.preventDefault()
  event.stopPropagation()
  store.dropOn(node.id)
}
</script>

<template>
  <ul class="rows">
    <li v-for="node in nodes" :key="node.id">
      <button
        type="button"
        class="row"
        :class="{ on: selected(node.id), nest: canHaveChildren(node.type) }"
        :style="{ paddingLeft: `${8 + depth * 12}px` }"
        draggable="true"
        @click="store.select({ kind: 'node', id: node.id })"
        @dragstart="onDragStart($event, node.id)"
        @dragover="onDragOver($event, node)"
        @drop="onDrop($event, node)"
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
small { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 42%; }
</style>
