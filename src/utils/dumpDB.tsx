import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import mime2ext from 'mime2ext'

import { _db } from '../'

// Quick and dirty. Will run into memory / blob size limits.
// In the future, break into chunks or add a streaming impl using FileSystemWritableFileStream
export async function dumpDB() {
  const allDocs = await _db.allDocs({
    include_docs: true,
    attachments: true,
    binary: true,
  })

  const docs = []
  const attachments = []

  for (const row of allDocs.rows) {
    if (row.id.startsWith('_design/')) {
      continue
    }

    const doc = row.doc!
    const docAttachments = doc._attachments ?? {}
    delete doc._attachments

    for (const [name, attachment] of Object.entries(docAttachments)) {
      if (!('data' in attachment)) {
        continue
      }

      let ext = mime2ext(attachment.content_type)

      // Cosmetic tweak
      if (ext === 'jpeg') {
        ext = 'jpg'
      }

      attachments.push({
        name: `${doc._id}!${name}${ext ? '.' + ext : ''}`,
        blob: attachment.data,
      })
    }

    docs.push(doc)
  }

  const zip = new JSZip()

  zip.file('entities.json', JSON.stringify(docs))

  const attachmentsFolder = zip.folder('attachments')!
  for (const attachment of attachments) {
    attachmentsFolder.file(attachment.name, attachment.blob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  await saveAs(zipBlob, 'time-thief-journal.zip')
}
