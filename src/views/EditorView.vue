<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { getMode } from '@/modes/registry'
import { useEditorStore } from '@/store/editor'
import { downloadBlob } from '@/utils/helpers'
import { zipProjectFiles } from '@/utils/zip'
import BlockPalette from '@/components/editor/BlockPalette.vue'
import NodeTree from '@/components/editor/NodeTree.vue'
import PropertyPanel from '@/components/editor/PropertyPanel.vue'
import PhonePreview from '@/components/editor/PhonePreview.vue'

const props = defineProps<{ modeId: string }>()
const route = useRoute()
const router = useRouter()
const store = useEditorStore()
const { doc, toast, mode } = storeToRefs(store)

watch(
  () => props.modeId,
  (id) => {
    const found = getMode(id)
    if (!found?.available) {
      router.replace('/')
      return
    }
    store.initMode(id)
  },
  { immediate: true },
)

function onKey(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  const typing = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  if (typing) return
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    store.removeSelected()
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

async function exportProject() {
  if (!mode.value) return
  const files = mode.value.generateProject(doc.value)
  const folder = doc.value.projectName || 'uni-generated-app'
  const blob = await zipProjectFiles(files, folder)
  downloadBlob(blob, `${folder}.zip`)
  store.notify('已开始下载完整工程')
}
</script>

<template>
  <div class="editor">
    <header class="top">
      <button class="back" type="button" @click="router.push('/')">← 模式</button>
      <div class="title">
        <strong>{{ mode?.name }} 生成器</strong>
        <span>{{ route.params.modeId }}</span>
      </div>
      <div class="actions">
        <button type="button" @click="store.loadExample">载入示例</button>
        <button type="button" @click="store.clearCanvas">清空画布</button>
        <button type="button" @click="store.duplicateSelected">复制</button>
        <button type="button" @click="store.moveSelected(-1)">上移</button>
        <button type="button" @click="store.moveSelected(1)">下移</button>
        <button type="button" class="danger" @click="store.removeSelected">删除</button>
        <button type="button" class="primary" @click="exportProject">导出完整项目</button>
      </div>
    </header>

    <aside class="left">
      <BlockPalette />
      <NodeTree />
      <PropertyPanel />
    </aside>

    <main class="right">
      <PhonePreview />
    </main>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<style scoped>
.editor {
  height: 100vh;
  display: grid;
  grid-template-columns: 360px 1fr;
  grid-template-rows: 56px 1fr;
}
.top {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid var(--line);
}
.back, .actions button {
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 9px;
  padding: 6px 10px;
}
.title { display: flex; flex-direction: column; line-height: 1.2; }
.title span { font-size: 11px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; }
.actions { margin-left: auto; display: flex; gap: 8px; flex-wrap: wrap; }
.primary {
  background: var(--accent) !important;
  color: #fff !important;
  border-color: var(--accent) !important;
}
.danger { color: var(--danger); }
.left {
  overflow: auto;
  background: #fff;
  border-right: 1px solid var(--line);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.right { overflow: hidden; background: linear-gradient(180deg, #eef2fb, #e6ebf5); }
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #121826;
  color: #fff;
  padding: 10px 16px;
  border-radius: 999px;
  font-size: 13px;
  z-index: 20;
}
</style>
