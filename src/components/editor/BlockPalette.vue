<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { BlockType } from '@/types/editor'
import { useEditorStore } from '@/store/editor'

const store = useEditorStore()
const { mode } = storeToRefs(store)

const groups = [
  { key: 'layout', title: '布局' },
  { key: 'basic', title: '基础' },
  { key: 'structure', title: '结构' },
] as const

function onDragStart(event: DragEvent, type: BlockType) {
  if (!event.dataTransfer) return
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('text/plain', type)
  store.draggingType = type
  store.draggingNodeId = null
}

function onDragEnd() {
  store.draggingType = null
  store.hoverDropId = null
}
</script>

<template>
  <section class="panel">
    <header>
      <h3>组件库</h3>
      <p>拖到右侧画布，或点击添加</p>
    </header>
    <div v-for="group in groups" :key="group.key" class="group">
      <h4>{{ group.title }}</h4>
      <div class="grid">
        <button
          v-for="block in (mode?.blocks ?? []).filter((b) => b.category === group.key)"
          :key="block.type"
          type="button"
          class="block"
          draggable="true"
          @dragstart="onDragStart($event, block.type)"
          @dragend="onDragEnd"
          @click="store.addNode(block.type)"
        >
          <span class="icon">{{ block.icon }}</span>
          <span class="label">{{ block.label }}</span>
          <span class="hint">{{ block.hint }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.panel { padding: 0 0 8px; }
header h3 { margin: 0; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
header p { margin: 4px 0 12px; color: var(--muted); font-size: 12px; }
.group { margin-bottom: 14px; }
h4 { margin: 0 0 8px; font-size: 12px; color: #98a2b3; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.block {
  display: grid;
  grid-template-columns: 28px 1fr;
  grid-template-rows: auto auto;
  column-gap: 8px;
  text-align: left;
  background: #f8faff;
  border: 1px dashed #d5def0;
  border-radius: 12px;
  padding: 8px;
  color: var(--ink);
}
.block:hover { border-color: var(--accent); background: var(--accent-soft); }
.icon {
  grid-row: 1 / span 2;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #fff;
  display: grid;
  place-items: center;
  font-size: 13px;
  align-self: center;
}
.label { font-size: 13px; font-weight: 700; }
.hint { font-size: 11px; color: var(--muted); }
</style>
