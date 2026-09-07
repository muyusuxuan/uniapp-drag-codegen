<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/store/editor'
import NodeTreeList from './NodeTreeList.vue'

const store = useEditorStore()
const { doc, selection } = storeToRefs(store)
</script>

<template>
  <section class="tree">
    <header>
      <h3>页面结构</h3>
      <div class="row-btns">
        <button type="button" :class="{ on: selection?.kind === 'page' }" @click="store.select({ kind: 'page' })">页面</button>
        <button
          v-if="doc.tabBar.enabled"
          type="button"
          :class="{ on: selection?.kind === 'tabBar' }"
          @click="store.select({ kind: 'tabBar' })"
        >
          标签栏
        </button>
      </div>
    </header>
    <p v-if="!doc.nodes.length" class="empty">尚未添加组件</p>
    <NodeTreeList v-else :nodes="doc.nodes" :depth="0" />
  </section>
</template>

<style scoped>
.tree h3 { margin: 0 0 8px; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
.row-btns { display: flex; gap: 6px; margin-bottom: 8px; }
.row-btns button {
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 8px;
  padding: 6px 8px;
}
.row-btns .on { border-color: var(--accent); background: var(--accent-soft); }
.empty { color: var(--muted); font-size: 12px; }
</style>
