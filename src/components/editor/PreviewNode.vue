<script setup lang="ts">
import { computed } from 'vue'
import type { CanvasNode } from '@/types/editor'
import { useEditorStore } from '@/store/editor'
import { canHaveChildren } from '@/utils/tree'

defineOptions({ name: 'PreviewNode' })

const props = defineProps<{
  node: CanvasNode
}>()

const store = useEditorStore()

const active = computed(() => store.selection?.kind === 'node' && store.selection.id === props.node.id)
const dropTarget = computed(() => store.hoverDropId === props.node.id)
const cssVars = computed(() => styleToCss(props.node.style))

function styleToCss(style: CanvasNode['style']): Record<string, string> {
  const out: Record<string, string> = {}
  if (style.width) out.width = style.width
  if (style.height) out.height = style.height
  if (style.padding) out.padding = style.padding
  if (style.margin) out.margin = style.margin
  if (style.backgroundColor) out.backgroundColor = style.backgroundColor
  if (style.color) out.color = style.color
  if (style.fontSize) out.fontSize = style.fontSize
  if (style.fontWeight) out.fontWeight = style.fontWeight
  if (style.textAlign) out.textAlign = style.textAlign
  if (style.lineHeight) out.lineHeight = style.lineHeight
  if (style.borderRadius) out.borderRadius = style.borderRadius
  if (style.border) out.border = style.border
  if (style.display) out.display = style.display
  if (style.flexDirection) out.flexDirection = style.flexDirection
  if (style.justifyContent) out.justifyContent = style.justifyContent
  if (style.alignItems) out.alignItems = style.alignItems
  if (style.gap) out.gap = style.gap
  if (style.overflow) out.overflow = style.overflow
  return out
}

function select(event: Event) {
  event.stopPropagation()
  store.select({ kind: 'node', id: props.node.id })
}

function onDragOver(event: DragEvent) {
  if (!canHaveChildren(props.node.type)) return
  event.preventDefault()
  event.stopPropagation()
  store.hoverDropId = props.node.id
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  store.dropOn(props.node.id)
}

function imageSrc(src?: string) {
  if (!src || src.startsWith('/static/')) return ''
  return src
}

const slides = computed(() =>
  [props.node.props.src1, props.node.props.src2, props.node.props.src3].filter(Boolean) as string[],
)
</script>

<template>
  <div
    class="wrap"
    :class="{ active, drop: dropTarget }"
    @click="select"
    @dragover="onDragOver"
    @drop="onDrop"
  >
    <div v-if="node.type === 'view'" class="uni-view" :style="cssVars">
      <PreviewNode v-for="child in node.children" :key="child.id" :node="child" />
      <p v-if="!node.children?.length" class="slot">放入子组件</p>
    </div>

    <div v-else-if="node.type === 'scroll-view'" class="uni-scroll" :style="cssVars">
      <PreviewNode v-for="child in node.children" :key="child.id" :node="child" />
      <p v-if="!node.children?.length" class="slot">滚动区域</p>
    </div>

    <span v-else-if="node.type === 'text'" class="uni-text" :style="cssVars">{{ node.props.text }}</span>

    <button v-else-if="node.type === 'button'" class="uni-btn" type="button" :style="cssVars">
      {{ node.props.text }}
    </button>

    <div v-else-if="node.type === 'image'" class="uni-image" :style="cssVars">
      <img v-if="imageSrc(node.props.src)" :src="imageSrc(node.props.src)" alt="" />
      <div v-else class="ph">图片占位</div>
    </div>

    <input
      v-else-if="node.type === 'input'"
      class="uni-input"
      :placeholder="node.props.placeholder"
      :value="node.props.value"
      :style="cssVars"
      readonly
    />

    <div v-else-if="node.type === 'swiper'" class="uni-swiper" :style="cssVars">
      <div class="slide">
        <img v-if="imageSrc(slides[0])" :src="imageSrc(slides[0])" alt="" />
        <div v-else class="ph">轮播占位</div>
      </div>
      <div class="dots">
        <i v-for="i in (slides.length || 3)" :key="i" :class="{ on: i === 1 }" />
      </div>
    </div>

    <div v-else-if="node.type === 'navigator'" class="uni-nav" :style="cssVars">
      <span>{{ node.props.text }}</span>
      <span class="arrow">›</span>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  position: relative;
  outline: 1px solid transparent;
  border-radius: 6px;
}
.wrap.active { outline: 1.5px solid var(--accent); outline-offset: 1px; }
.wrap.drop { outline: 1.5px dashed var(--ok); background: rgba(7, 193, 96, 0.06); }
.uni-view, .uni-scroll { min-height: 36px; box-sizing: border-box; }
.uni-scroll { overflow: auto; }
.uni-text { display: block; white-space: pre-wrap; word-break: break-word; }
.uni-btn {
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.uni-image, .uni-swiper, .slide {
  overflow: hidden;
  position: relative;
}
.uni-image img, .slide img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ph {
  width: 100%;
  height: 100%;
  min-height: 80px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #2b6cff, #7aa2ff);
  color: #fff;
  font-size: 13px;
  letter-spacing: 0.08em;
}
.uni-input { border: none; outline: none; box-sizing: border-box; }
.uni-nav { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; }
.arrow { color: #c0c6d4; font-size: 18px; }
.slot { margin: 0; color: #b0b8c7; font-size: 12px; text-align: center; }
.dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 8px;
  display: flex;
  justify-content: center;
  gap: 5px;
}
.dots i { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,.55); display: block; }
.dots i.on { background: #fff; }
</style>
