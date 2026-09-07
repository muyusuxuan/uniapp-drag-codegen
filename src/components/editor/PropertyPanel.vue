<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/store/editor'
import { uid } from '@/utils/helpers'

const store = useEditorStore()
const { doc, selection, selectedNode } = storeToRefs(store)

const kind = computed(() => selection.value?.kind ?? 'page')

function styleModel(key: keyof NonNullable<typeof selectedNode.value>['style']) {
  return computed({
    get: () => selectedNode.value?.style[key] ?? '',
    set: (value: string) => store.updateSelectedStyle(key, value),
  })
}

function propModel(key: string) {
  return computed({
    get: () => selectedNode.value?.props[key] ?? '',
    set: (value: string) => store.updateSelectedProp(key, value),
  })
}

const width = styleModel('width')
const height = styleModel('height')
const padding = styleModel('padding')
const margin = styleModel('margin')
const fontSize = styleModel('fontSize')
const color = styleModel('color')
const backgroundColor = styleModel('backgroundColor')
const borderRadius = styleModel('borderRadius')
const fontWeight = styleModel('fontWeight')
const textAlign = styleModel('textAlign')
const flexDirection = styleModel('flexDirection')
const justifyContent = styleModel('justifyContent')
const alignItems = styleModel('alignItems')
const gap = styleModel('gap')

const text = propModel('text')
const src = propModel('src')
const mode = propModel('mode')
const placeholder = propModel('placeholder')
const buttonType = propModel('buttonType')
const url = propModel('url')
const src1 = propModel('src1')
const src2 = propModel('src2')
const src3 = propModel('src3')

function addTab() {
  if (doc.value.tabBar.list.length >= 5) return
  const n = doc.value.tabBar.list.length + 1
  doc.value.tabBar.list.push({ id: uid('tab'), text: `标签${n}`, pageKey: `tab${n}` })
}

function removeTab(id: string) {
  if (doc.value.tabBar.list.length <= 2) return
  doc.value.tabBar.list = doc.value.tabBar.list.filter((item) => item.id !== id)
}
</script>

<template>
  <section class="props">
    <header>
      <h3>属性</h3>
      <p v-if="kind === 'page'">页面窗口</p>
      <p v-else-if="kind === 'tabBar'">底部标签栏</p>
      <p v-else-if="selectedNode">{{ selectedNode.name }}</p>
    </header>

    <div v-if="kind === 'page'" class="fields">
      <label>项目名称<input v-model="doc.projectName" /></label>
      <label>导航标题<input v-model="doc.page.title" /></label>
      <label>页面背景
        <span class="color">
          <input v-model="doc.page.backgroundColor" />
          <input v-model="doc.page.backgroundColor" type="color" />
        </span>
      </label>
      <label>导航栏背景
        <span class="color">
          <input v-model="doc.page.navigationBarBackgroundColor" />
          <input v-model="doc.page.navigationBarBackgroundColor" type="color" />
        </span>
      </label>
      <label>导航文字
        <select v-model="doc.page.navigationBarTextStyle">
          <option value="black">黑色</option>
          <option value="white">白色</option>
        </select>
      </label>
    </div>

    <div v-else-if="kind === 'tabBar'" class="fields">
      <label>未选中颜色
        <span class="color">
          <input v-model="doc.tabBar.color" />
          <input v-model="doc.tabBar.color" type="color" />
        </span>
      </label>
      <label>选中颜色
        <span class="color">
          <input v-model="doc.tabBar.selectedColor" />
          <input v-model="doc.tabBar.selectedColor" type="color" />
        </span>
      </label>
      <label>栏背景
        <span class="color">
          <input v-model="doc.tabBar.backgroundColor" />
          <input v-model="doc.tabBar.backgroundColor" type="color" />
        </span>
      </label>
      <div class="tabs">
        <div v-for="item in doc.tabBar.list" :key="item.id" class="tab-item">
          <input v-model="item.text" placeholder="文案" />
          <input v-model="item.pageKey" placeholder="pageKey" />
          <button type="button" class="ghost" :disabled="doc.tabBar.list.length <= 2" @click="removeTab(item.id)">删除</button>
        </div>
        <button type="button" class="ghost" :disabled="doc.tabBar.list.length >= 5" @click="addTab">添加标签</button>
        <p class="tip">首页请保持 pageKey 为 index。其余标签会生成对应空白页面。</p>
      </div>
    </div>

    <div v-else-if="selectedNode" class="fields">
      <template v-if="selectedNode.type === 'text' || selectedNode.type === 'button' || selectedNode.type === 'navigator'">
        <label>文案<input v-model="text" /></label>
      </template>
      <template v-if="selectedNode.type === 'button'">
        <label>按钮类型
          <select v-model="buttonType">
            <option value="default">default</option>
            <option value="primary">primary</option>
            <option value="warn">warn</option>
          </select>
        </label>
      </template>
      <template v-if="selectedNode.type === 'image'">
        <label>图片地址<input v-model="src" placeholder="/static/logo.png 或 https://" /></label>
        <label>裁剪模式
          <select v-model="mode">
            <option value="aspectFill">aspectFill</option>
            <option value="aspectFit">aspectFit</option>
            <option value="scaleToFill">scaleToFill</option>
            <option value="widthFix">widthFix</option>
          </select>
        </label>
      </template>
      <template v-if="selectedNode.type === 'input'">
        <label>占位符<input v-model="placeholder" /></label>
      </template>
      <template v-if="selectedNode.type === 'navigator'">
        <label>跳转路径<input v-model="url" /></label>
      </template>
      <template v-if="selectedNode.type === 'swiper'">
        <label>图片 1<input v-model="src1" /></label>
        <label>图片 2<input v-model="src2" /></label>
        <label>图片 3<input v-model="src3" /></label>
      </template>

      <div class="pair">
        <label>宽度<input v-model="width" placeholder="100% / 200px" /></label>
        <label>高度<input v-model="height" placeholder="44px" /></label>
      </div>
      <template v-if="selectedNode.type === 'text' || selectedNode.type === 'button' || selectedNode.type === 'navigator' || selectedNode.type === 'input'">
        <label>字号<input v-model="fontSize" placeholder="16px" /></label>
        <label>文字颜色
          <span class="color">
            <input v-model="color" />
            <input v-model="color" type="color" />
          </span>
        </label>
      </template>
      <label v-if="selectedNode.type === 'text'">字重<input v-model="fontWeight" placeholder="400 / 700" /></label>
      <label v-if="selectedNode.type === 'text'">对齐
        <select v-model="textAlign">
          <option value="">默认</option>
          <option value="left">左</option>
          <option value="center">中</option>
          <option value="right">右</option>
        </select>
      </label>
      <label>背景色
        <span class="color">
          <input v-model="backgroundColor" />
          <input v-model="backgroundColor" type="color" />
        </span>
      </label>
      <div class="pair">
        <label>内边距<input v-model="padding" placeholder="12px" /></label>
        <label>外边距<input v-model="margin" placeholder="0" /></label>
      </div>
      <label>圆角<input v-model="borderRadius" placeholder="8px" /></label>
      <template v-if="selectedNode.type === 'view' || selectedNode.type === 'scroll-view'">
        <label>排列方向
          <select v-model="flexDirection">
            <option value="column">纵向</option>
            <option value="row">横向</option>
          </select>
        </label>
        <label>主轴对齐<input v-model="justifyContent" placeholder="flex-start / center" /></label>
        <label>交叉轴对齐<input v-model="alignItems" placeholder="stretch / center" /></label>
        <label>间距<input v-model="gap" placeholder="8px" /></label>
      </template>
    </div>
  </section>
</template>

<style scoped>
.props h3 { margin: 0; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
.props header p { margin: 4px 0 12px; font-size: 13px; font-weight: 700; }
.fields { display: flex; flex-direction: column; gap: 10px; }
label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--muted); }
input, select {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 7px 8px;
  background: #fff;
  color: var(--ink);
}
.color { display: flex; gap: 6px; }
.color input[type='color'] { width: 42px; padding: 2px; }
.pair { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.tabs { display: flex; flex-direction: column; gap: 8px; }
.tab-item { display: grid; grid-template-columns: 1fr 1fr auto; gap: 6px; }
.ghost {
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 8px;
  padding: 6px 8px;
}
.ghost:disabled { opacity: 0.4; }
.tip { margin: 0; font-size: 11px; color: var(--muted); line-height: 1.5; }
</style>
