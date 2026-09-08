import type { CanvasNode, EditorDocument, NodeStyle, ProjectFile, TabBarItem } from '@/types/editor'
import { escapeAttr, escapeHtml } from '@/utils/helpers'
import { flattenNodes } from '@/utils/tree'

const UNI_VERSION = '3.0.0-4070620250821001'

const KEYWORD_STYLE_KEYS = new Set<keyof NodeStyle>([
  'fontWeight',
  'display',
  'flexDirection',
  'flexWrap',
  'justifyContent',
  'alignItems',
  'textAlign',
  'overflow',
  'flex',
  'position',
])

export function toUniCssValue(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const value = raw.trim()
  if (!value) return undefined
  if (/%|rpx|vh|vw|em|rem|auto|deg|transparent|none/.test(value) || value.startsWith('#') || value.includes(' ')) {
    if (/^(-?\d+(?:\.\d+)?)px(\s|$)/.test(value) || value.split(/\s+/).some((part) => /^\d+(?:\.\d+)?px$/.test(part))) {
      return value
        .split(/\s+/)
        .map((part) => {
          const m = part.match(/^(-?\d+(?:\.\d+)?)px$/)
          return m ? `${Number(m[1]) * 2}rpx` : part
        })
        .join(' ')
    }
    return value
  }
  const match = value.match(/^(-?\d+(?:\.\d+)?)(px)?$/)
  if (match) return `${Number(match[1]) * 2}rpx`
  return value
}

function styleToDeclarations(style: NodeStyle): string[] {
  const map: Array<[keyof NodeStyle, string]> = [
    ['width', 'width'],
    ['height', 'height'],
    ['minWidth', 'min-width'],
    ['minHeight', 'min-height'],
    ['padding', 'padding'],
    ['margin', 'margin'],
    ['backgroundColor', 'background-color'],
    ['color', 'color'],
    ['fontSize', 'font-size'],
    ['fontWeight', 'font-weight'],
    ['textAlign', 'text-align'],
    ['lineHeight', 'line-height'],
    ['borderRadius', 'border-radius'],
    ['border', 'border'],
    ['display', 'display'],
    ['flexDirection', 'flex-direction'],
    ['flexWrap', 'flex-wrap'],
    ['justifyContent', 'justify-content'],
    ['alignItems', 'align-items'],
    ['gap', 'gap'],
    ['flex', 'flex'],
    ['overflow', 'overflow'],
    ['position', 'position'],
    ['left', 'left'],
    ['top', 'top'],
  ]
  const parts: string[] = []
  for (const [key, cssKey] of map) {
    const raw = style[key]
    if (!raw) continue
    if (key === 'lineHeight' && /^[\d.]+$/.test(raw.trim())) {
      parts.push(`${cssKey}: ${raw.trim()};`)
      continue
    }
    const converted = KEYWORD_STYLE_KEYS.has(key) ? raw.trim() : (toUniCssValue(raw) ?? raw.trim())
    parts.push(`${cssKey}: ${converted};`)
  }
  return parts
}

export function className(id: string): string {
  return `n-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`
}

function pad(level: number): string {
  return '  '.repeat(level)
}

export function compileNode(node: CanvasNode, level: number): string {
  const cls = className(node.id)
  const i = pad(level)
  switch (node.type) {
    case 'text':
      return `${i}<text class="${cls}">${escapeHtml(node.props.text || '')}</text>`
    case 'button': {
      const typeAttr =
        node.props.buttonType && node.props.buttonType !== 'default'
          ? ` type="${escapeAttr(node.props.buttonType)}"`
          : ''
      return `${i}<button class="${cls}"${typeAttr}>${escapeHtml(node.props.text || '按钮')}</button>`
    }
    case 'image': {
      const src = escapeAttr(node.props.src || '/static/logo.png')
      const mode = escapeAttr(node.props.mode || 'aspectFill')
      return `${i}<image class="${cls}" src="${src}" mode="${mode}" />`
    }
    case 'input': {
      const placeholder = escapeAttr(node.props.placeholder || '请输入')
      const value = escapeAttr(node.props.value || '')
      return `${i}<input class="${cls}" placeholder="${placeholder}" value="${value}" />`
    }
    case 'swiper': {
      const slides = [node.props.src1, node.props.src2, node.props.src3].filter(Boolean) as string[]
      const sources = slides.length ? slides : ['/static/logo.png']
      const items = sources
        .map(
          (src) =>
            `${i}  <swiper-item>\n${i}    <image class="${cls}-img" src="${escapeAttr(src)}" mode="aspectFill" />\n${i}  </swiper-item>`,
        )
        .join('\n')
      const dots = node.props.indicatorDots === 'false' ? 'false' : 'true'
      const autoplay = node.props.autoplay === 'false' ? 'false' : 'true'
      return `${i}<swiper class="${cls}" indicator-dots="${dots}" autoplay="${autoplay}" circular>\n${items}\n${i}</swiper>`
    }
    case 'navigator': {
      const url = escapeAttr(node.props.url || '/pages/index/index')
      return `${i}<navigator class="${cls}" url="${url}" hover-class="navigator-hover">\n${i}  <text class="${cls}-text">${escapeHtml(node.props.text || '跳转')}</text>\n${i}  <text class="${cls}-arrow">›</text>\n${i}</navigator>`
    }
    case 'scroll-view': {
      const inner = (node.children ?? []).map((child) => compileNode(child, level + 1)).join('\n')
      return `${i}<scroll-view class="${cls}" scroll-y>\n${inner}\n${i}</scroll-view>`
    }
    case 'row':
    case 'view':
    default: {
      const inner = (node.children ?? []).map((child) => compileNode(child, level + 1)).join('\n')
      return `${i}<view class="${cls}">\n${inner}\n${i}</view>`
    }
  }
}

function ensureContainerLayout(node: CanvasNode, decls: string[]): void {
  const isContainer = node.type === 'view' || node.type === 'row' || node.type === 'scroll-view'
  if (!isContainer) return
  const joined = decls.join(' ')
  if (!node.style.display && !joined.includes('display:')) decls.unshift('display: flex;')
  if (!node.style.flexDirection && !joined.includes('flex-direction:')) {
    decls.push(node.type === 'row' ? 'flex-direction: row;' : 'flex-direction: column;')
  }
}

function compileStyles(nodes: CanvasNode[]): string {
  const lines: string[] = []
  for (const node of flattenNodes(nodes)) {
    const decls = styleToDeclarations(node.style)
    ensureContainerLayout(node, decls)
    if (node.type === 'navigator') {
      decls.push('display: flex;', 'align-items: center;', 'justify-content: space-between;', 'box-sizing: border-box;')
    }
    if (node.type === 'button') {
      decls.push('border: none;', 'line-height: 1.2;', 'box-sizing: border-box;')
    }
    if (node.type === 'image' || node.type === 'swiper') {
      decls.push('display: block;', 'overflow: hidden;')
    }
    if (decls.length) lines.push(`.${className(node.id)} { ${decls.join(' ')} }`)
    if (node.type === 'swiper') {
      lines.push(`.${className(node.id)}-img { width: 100%; height: 100%; }`)
    }
  }
  return lines.join('\n')
}

export function pageKeyToPath(pageKey: string): string {
  const key = pageKey.replace(/[^a-zA-Z0-9_-]/g, '') || 'page'
  return `pages/${key}/${key}`
}

function extraTabPages(list: TabBarItem[]): Array<TabBarItem & { resolvedKey: string }> {
  return list
    .map((item, index) => ({
      ...item,
      resolvedKey: index === 0 ? 'index' : item.pageKey === 'index' ? `tab${index + 1}` : item.pageKey,
    }))
    .slice(1)
}

function stubPageVue(title: string): string {
  return `<template>
  <view class="stub">
    <text class="stub-title">${escapeHtml(title)}</text>
    <text class="stub-desc">此页面由可视化生成器根据底部标签栏自动创建，可在 HBuilderX 中继续完善。</text>
  </view>
</template>

<script setup>
</script>

<style scoped>
.stub {
  min-height: 100vh;
  padding: 80rpx 48rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  background: #f5f6f8;
}
.stub-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #111827;
}
.stub-desc {
  font-size: 28rpx;
  color: #667085;
  line-height: 1.6;
}
</style>
`
}

export function indexPageVue(doc: EditorDocument): string {
  const body =
    doc.nodes.length > 0
      ? doc.nodes.map((node) => compileNode(node, 2)).join('\n')
      : '    <view class="empty">\n      <text>从生成器拖入组件开始搭建页面</text>\n    </view>'
  const styles = compileStyles(doc.nodes)
  const bg = toUniCssValue(doc.page.backgroundColor) ?? doc.page.backgroundColor
  return `<template>
  <view class="page">
${body}
  </view>
</template>

<script setup>
</script>

<style scoped>
.page {
  min-height: 100vh;
  box-sizing: border-box;
  background-color: ${bg};
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.empty {
  padding: 80rpx 32rpx;
  text-align: center;
  color: #98a2b3;
  font-size: 28rpx;
}
${styles}
</style>
`
}

export function pagesJson(doc: EditorDocument): string {
  const pages: Array<Record<string, unknown>> = [
    {
      path: 'pages/index/index',
      style: {
        navigationBarTitleText: doc.page.title,
        navigationBarBackgroundColor: doc.page.navigationBarBackgroundColor,
        navigationBarTextStyle: doc.page.navigationBarTextStyle,
        backgroundColor: doc.page.backgroundColor,
      },
    },
  ]

  if (doc.tabBar.enabled) {
    for (const item of extraTabPages(doc.tabBar.list)) {
      pages.push({
        path: pageKeyToPath(item.resolvedKey),
        style: {
          navigationBarTitleText: item.text,
          navigationBarBackgroundColor: doc.page.navigationBarBackgroundColor,
          navigationBarTextStyle: doc.page.navigationBarTextStyle,
        },
      })
    }
  }

  const json: Record<string, unknown> = {
    pages,
    globalStyle: {
      navigationBarTextStyle: doc.page.navigationBarTextStyle,
      navigationBarTitleText: doc.page.title,
      navigationBarBackgroundColor: doc.page.navigationBarBackgroundColor,
      backgroundColor: doc.page.backgroundColor,
    },
  }

  if (doc.tabBar.enabled && doc.tabBar.list.length >= 2) {
    json.tabBar = {
      color: doc.tabBar.color,
      selectedColor: doc.tabBar.selectedColor,
      backgroundColor: doc.tabBar.backgroundColor,
      borderStyle: 'black',
      list: doc.tabBar.list.map((item, index) => ({
        pagePath:
          index === 0
            ? 'pages/index/index'
            : pageKeyToPath(extraTabPages(doc.tabBar.list)[index - 1]?.resolvedKey ?? item.pageKey),
        text: item.text,
        iconPath: 'static/tab-default.png',
        selectedIconPath: 'static/tab-active.png',
      })),
    }
  }

  return `${JSON.stringify(json, null, 2)}\n`
}

function manifestJson(doc: EditorDocument): string {
  return `${JSON.stringify(
    {
      name: doc.projectName || 'uni-generated-app',
      appid: '',
      description: '由 UniApp 可视化生成器导出',
      versionName: '1.0.0',
      versionCode: '100',
      transformPx: false,
      'app-plus': {
        usingComponents: true,
        nvueStyleCompiler: 'uni-app',
        compilerVersion: 3,
        splashscreen: {
          alwaysShowBeforeRender: true,
          waiting: true,
          autoclose: true,
          delay: 0,
        },
        modules: {},
        distribute: {
          android: { permissions: [] },
          ios: {},
          sdkConfigs: {},
        },
      },
      'mp-weixin': {
        appid: '',
        setting: { urlCheck: false },
        usingComponents: true,
      },
      'mp-alipay': { usingComponents: true },
      'mp-baidu': { usingComponents: true },
      'mp-toutiao': { usingComponents: true },
      uniStatistics: { enable: false },
      vueVersion: '3',
    },
    null,
    2,
  )}\n`
}

function packageJson(doc: EditorDocument): string {
  const name = (doc.projectName || 'uni-generated-app').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '')
  return `${JSON.stringify(
    {
      name: name || 'uni-generated-app',
      version: '1.0.0',
      private: true,
      scripts: {
        'dev:h5': 'uni',
        'dev:mp-weixin': 'uni -p mp-weixin',
        'build:h5': 'uni build',
        'build:mp-weixin': 'uni build -p mp-weixin',
      },
      dependencies: {
        '@dcloudio/uni-app': UNI_VERSION,
        '@dcloudio/uni-app-plus': UNI_VERSION,
        '@dcloudio/uni-components': UNI_VERSION,
        '@dcloudio/uni-h5': UNI_VERSION,
        '@dcloudio/uni-mp-weixin': UNI_VERSION,
        vue: '^3.4.21',
      },
      devDependencies: {
        '@dcloudio/types': '^3.4.14',
        '@dcloudio/uni-automator': UNI_VERSION,
        '@dcloudio/uni-cli-shared': UNI_VERSION,
        '@dcloudio/vite-plugin-uni': UNI_VERSION,
        sass: '^1.77.0',
        vite: '5.2.8',
      },
    },
    null,
    2,
  )}\n`
}

function viteConfig(): string {
  return `import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
})
`
}

function indexHtml(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>uni-app</title>
    <script type="module" src="/src/main.js"></script>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
`
}

function mainJs(): string {
  return `import { createSSRApp } from 'vue'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  return { app }
}
`
}

function appVue(): string {
  return `<script>
export default {
  onLaunch() {},
  onShow() {},
  onHide() {},
}
</script>

<style>
page {
  background-color: #f5f6f8;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Helvetica, sans-serif;
}
</style>
`
}

function uniScss(): string {
  return `/* 生成器导出的全局样式变量，可按项目需要调整 */
$uni-color-primary: #07c160;
$uni-color-success: #07c160;
$uni-color-warning: #ff9900;
$uni-color-error: #e5484d;
$uni-text-color: #1c2333;
$uni-bg-color: #f5f6f8;
`
}

function projectReadme(doc: EditorDocument): string {
  return `# ${doc.projectName || 'uni-generated-app'}

本项目由 **UniApp 可视化生成器** 导出，结构遵循 uni-app Vue3（Vite）约定。

## 用 HBuilderX 打开

1. 安装 [HBuilderX](https://www.dcloud.io/hbuilderx.html)
2. 菜单：文件 → 导入 → 从本地目录导入
3. 选择本目录，运行到浏览器 / 微信开发者工具

## 用 CLI 运行

\`\`\`bash
npm install
npm run dev:h5
\`\`\`

微信小程序：

\`\`\`bash
npm run dev:mp-weixin
\`\`\`

然后将 \`dist/dev/mp-weixin\` 导入微信开发者工具。

## 目录说明

- \`src/pages/index/index.vue\`：可视化画布生成的首页
- \`src/pages.json\`：页面路由与${doc.tabBar.enabled ? ' tabBar ' : ' '}窗口配置
- \`src/manifest.json\`：应用清单（请自行填写 appid）
- \`src/static/\`：占位图与 tab 图标

导出后请按真实业务替换图片、补齐交互与接口。
`
}

export const PNG_LOGO_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAPAAAAB4CAIAAABD1OhwAAAA+0lEQVR42u3SQQkAAAgEwetjNft/tYbIwCRYNtUDb0QCDA2GBkODoTE0GBoMDYYGQ2NoMDQYGgwNhsbQYGgwNBgaDI2hwdBgaDA0GBpDg6HB0GBoMDSGBkODocHQYGgMDYYGQ4OhMTQYGgwNhgZDY2gwNBgaDA2GxtBgaDA0GBoMjaHB0GBoMDQYGkODocHQYGgwNIYGQ4OhwdBgaAwNhgZDg6HB0BgaDA2GBkNjaDA0GBoMDYbG0GBoMDQYGgyNocHQYGgwNBgaQ4OhwdBgaDA0hgZDg6HB0GBoDA2GBkODocHQGBoMDYYGQ2NoFTA0GBoMDYbG0GBouGUBddR1b4o2YsMAAAAASUVORK5CYII='
export const PNG_TAB_DEFAULT_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAFEAAABRCAIAAAAl7d1hAAAAZ0lEQVR42u3PAQ0AAAwCIPs3sK05vkMD0n/i7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ox8xgA5WvZPhuaibQAAAABJRU5ErkJggg=='
export const PNG_TAB_ACTIVE_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAFEAAABRCAIAAAAl7d1hAAAAaklEQVR42u3PQQ0AAAgEoPtZ06o2M4eTjQKkpr+Js7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7PzGQvqHKPcXgPmiwAAAABJRU5ErkJggg=='

export function generateUniProject(doc: EditorDocument): ProjectFile[] {
  const files: ProjectFile[] = [
    { path: 'package.json', content: packageJson(doc) },
    { path: 'vite.config.js', content: viteConfig() },
    { path: 'index.html', content: indexHtml() },
    { path: 'README.md', content: projectReadme(doc) },
    { path: 'src/main.js', content: mainJs() },
    { path: 'src/App.vue', content: appVue() },
    { path: 'src/uni.scss', content: uniScss() },
    { path: 'src/manifest.json', content: manifestJson(doc) },
    { path: 'src/pages.json', content: pagesJson(doc) },
    { path: 'src/pages/index/index.vue', content: indexPageVue(doc) },
    { path: 'src/static/logo.png', content: PNG_LOGO_B64, encoding: 'base64' },
    { path: 'src/static/tab-default.png', content: PNG_TAB_DEFAULT_B64, encoding: 'base64' },
    { path: 'src/static/tab-active.png', content: PNG_TAB_ACTIVE_B64, encoding: 'base64' },
  ]

  if (doc.tabBar.enabled) {
    for (const item of extraTabPages(doc.tabBar.list)) {
      files.push({
        path: `src/${pageKeyToPath(item.resolvedKey)}.vue`,
        content: stubPageVue(item.text),
      })
    }
  }

  return files
}
