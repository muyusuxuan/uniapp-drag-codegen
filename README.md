# UniApp 可视化生成器

拖拽搭建 UniApp 页面，实时预览，并导出可在 HBuilderX 或 CLI 中打开的完整 Vue3 工程。

## 本地运行生成器

```bash
npm install
npm run dev
```

浏览器打开终端提示的地址（默认 `http://localhost:5173`）。

其他命令：

```bash
npm run test    # 生成器与树结构单测
npm run build   # 生产构建
```

## 编辑器布局

编辑器采用经典三栏结构：

- **左侧**：组件库（可拖拽的积木）与页面结构树
- **中间**：手机画布，实时预览；点击选中，在组件上按住拖动即可排序 / 换父级
- **右侧**：当前选中组件（或页面 / 标签栏）的属性面板

拖入时会显示前后 / 内部的落点指示线。容器支持纵向、横向与换行，可用「横向容器」把多个组件放在同一行。

## 使用流程

1. 首页选择生成模式。当前主模式为 **UniApp**（后续可扩展其他语法/目录）。
2. 从左侧组件库拖入或点击：容器、横向容器、滚动容器、文本、按钮、图片、输入框、轮播、跳转单元格、底部标签栏。
3. 在中间手机框中查看实时预览；点击组件后，右侧可改宽高、边距、字号、颜色、文案、图片地址、tab 项，以及容器的方向 / 对齐 / 间距 / 换行。
4. 将组件拖到画布上的精确插槽（前 / 后 / 容器内）；也可在画布上直接拖动已有组件，实现重排与嵌套。选中后可用边角手柄调整宽高。
5. 需要同一行多个组件时，先放入 **横向容器**，再把按钮、文本或子容器拖进去。
6. 点击 **导出完整项目**，下载 zip。

## 导出工程如何使用

解压后是一个 uni-app Vue3（Vite）项目，核心文件包括：

- `src/pages/index/index.vue`：与画布对应的首页（含 `display:flex`、`flex-direction`、`gap` 等布局样式）
- `src/pages.json`：页面路由；若启用了底部标签栏则包含 `tabBar`
- `src/manifest.json`、`src/App.vue`、`src/main.js`、`src/uni.scss`
- `package.json`、`vite.config.js`、`README.md`

### HBuilderX

1. 安装 [HBuilderX](https://www.dcloud.io/hbuilderx.html)
2. 文件 → 导入 → 从本地目录导入（选择解压后的文件夹）
3. 运行到浏览器或微信开发者工具  
   请使用支持 **uni-app Vite / Vue3** 的 HBuilderX 版本。打开后请在 `manifest.json` 填写自己的 appid。

### CLI

```bash
cd <解压目录>
npm install
npm run dev:h5
```

微信小程序：

```bash
npm run dev:mp-weixin
```

把 `dist/dev/mp-weixin` 导入微信开发者工具即可。

## 项目结构（本仓库）

```
src/
  modes/           # 可扩展的生成模式（UniApp 为 v1 主模式）
  store/           # 画布、选中态、拖拽落点
  components/editor/
  views/           # 模式选择页 / 编辑器
  utils/drop.ts    # 前后 / 内部落点计算
```

画布数据会写入浏览器 `localStorage`，刷新后仍可继续编辑。
