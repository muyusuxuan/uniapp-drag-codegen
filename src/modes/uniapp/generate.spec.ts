import { describe, expect, it } from 'vitest'
import type { EditorDocument } from '@/types/editor'
import { createUniExample, createUniNode } from './factory'
import { generateUniProject, indexPageVue, pagesJson, toUniCssValue } from './generate'

function sampleDoc(): EditorDocument {
  const example = createUniExample()
  return {
    projectName: 'demo-mall',
    modeId: 'uniapp',
    ...example,
  }
}

describe('toUniCssValue', () => {
  it('converts px to rpx at 2x', () => {
    expect(toUniCssValue('16px')).toBe('32rpx')
    expect(toUniCssValue('12')).toBe('24rpx')
    expect(toUniCssValue('12px 8px')).toBe('24rpx 16rpx')
  })

  it('keeps percentages and rpx', () => {
    expect(toUniCssValue('100%')).toBe('100%')
    expect(toUniCssValue('32rpx')).toBe('32rpx')
    expect(toUniCssValue('#07c160')).toBe('#07c160')
  })
})

describe('generateUniProject', () => {
  it('emits a complete uni-app vue3 scaffold', () => {
    const files = generateUniProject(sampleDoc())
    const paths = files.map((file) => file.path)
    expect(paths).toEqual(expect.arrayContaining([
      'package.json',
      'vite.config.js',
      'index.html',
      'README.md',
      'src/main.js',
      'src/App.vue',
      'src/uni.scss',
      'src/manifest.json',
      'src/pages.json',
      'src/pages/index/index.vue',
      'src/pages/mine/mine.vue',
      'src/static/logo.png',
    ]))
    expect(files.find((f) => f.path === 'src/static/logo.png')?.encoding).toBe('base64')
  })

  it('writes pages.json tabBar and homepage matching the canvas', () => {
    const doc = sampleDoc()
    const json = JSON.parse(pagesJson(doc)) as {
      pages: Array<{ path: string; style: { navigationBarTitleText: string } }>
      tabBar: { list: Array<{ pagePath: string; text: string }> }
    }
    expect(json.pages[0]?.path).toBe('pages/index/index')
    expect(json.pages[0]?.style.navigationBarTitleText).toBe('商城首页')
    expect(json.tabBar.list).toHaveLength(2)
    expect(json.tabBar.list[0]?.pagePath).toBe('pages/index/index')
    expect(json.tabBar.list[1]?.pagePath).toBe('pages/mine/mine')
  })

  it('compiles canvas nodes into uni-app SFC tags', () => {
    const button = createUniNode('button')
    button.props.text = '立即体验'
    const text = createUniNode('text')
    text.props.text = '欢迎来到示例商城'
    const doc = sampleDoc()
    doc.nodes = [text, button]
    const vue = indexPageVue(doc)
    expect(vue).toContain('<text class=')
    expect(vue).toContain('欢迎来到示例商城')
    expect(vue).toContain('<button class=')
    expect(vue).toContain('立即体验')
    expect(vue).toContain('type="primary"')
  })

  it('creates 横向容器 with row flex by default', () => {
    const row = createUniNode('row')
    expect(row.type).toBe('row')
    expect(row.style.display).toBe('flex')
    expect(row.style.flexDirection).toBe('row')
    expect(row.style.flexWrap).toBe('nowrap')
  })

  it('emits flex row layout for 横向容器 and nested children', () => {
    const row = createUniNode('row')
    row.style.gap = '8px'
    row.style.flexWrap = 'wrap'
    const left = createUniNode('button')
    left.props.text = '左按钮'
    left.style.flex = '1'
    const right = createUniNode('button')
    right.props.text = '右按钮'
    right.style.flex = '1'
    row.children = [left, right]
    const doc = sampleDoc()
    doc.nodes = [row]
    const vue = indexPageVue(doc)
    expect(vue).toContain('<view class=')
    expect(vue).toContain('左按钮')
    expect(vue).toContain('右按钮')
    expect(vue).toContain('display: flex')
    expect(vue).toContain('flex-direction: row')
    expect(vue).toContain('flex-wrap: wrap')
    expect(vue).toContain('gap:')
    expect(vue).toContain('flex: 1')
    expect(vue).toMatch(/\.page \{[\s\S]*display: flex;[\s\S]*flex-direction: column/)
  })

  it('escapes text in generated template', () => {
    const text = createUniNode('text')
    text.props.text = '<script>alert(1)</script>'
    const doc = sampleDoc()
    doc.nodes = [text]
    expect(indexPageVue(doc)).toContain('&lt;script&gt;')
    expect(indexPageVue(doc)).not.toContain('<script>alert')
  })
})
