import JSZip from 'jszip'
import type { ProjectFile } from '@/types/editor'

export async function zipProjectFiles(files: ProjectFile[], rootFolder: string): Promise<Blob> {
  const zip = new JSZip()
  const root = zip.folder(rootFolder)
  if (!root) throw new Error('无法创建压缩目录')
  for (const file of files) {
    if (file.encoding === 'base64') {
      root.file(file.path, file.content, { base64: true })
    } else {
      root.file(file.path, file.content)
    }
  }
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
}
