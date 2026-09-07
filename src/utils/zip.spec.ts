import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { createUniExample } from '@/modes/uniapp/factory'
import { generateUniProject } from '@/modes/uniapp/generate'
import { zipProjectFiles } from './zip'

describe('zipProjectFiles', () => {
  it('packs generated files under the project folder', async () => {
    const files = generateUniProject({
      projectName: 'demo-mall',
      modeId: 'uniapp',
      ...createUniExample(),
    })
    const blob = await zipProjectFiles(files, 'demo-mall')
    const zip = await JSZip.loadAsync(await blob.arrayBuffer())
    expect(zip.file('demo-mall/src/pages.json')).toBeTruthy()
    expect(zip.file('demo-mall/src/pages/index/index.vue')).toBeTruthy()
    expect(zip.file('demo-mall/src/static/logo.png')).toBeTruthy()
    const pages = await zip.file('demo-mall/src/pages.json')!.async('string')
    expect(pages).toContain('"tabBar"')
    expect(pages).toContain('pages/index/index')
  })
})
