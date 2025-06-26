import type { NextApiRequest, NextApiResponse } from 'next'
import { drive } from '@/lib/drive'
import { Readable } from 'stream'

export const config = {
  api: {
    responseLimit: false, // allows streaming large image files
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const fileId = req.query.fileId as string

  if (!fileId) {
    res.status(400).send('Missing fileId')
    return
  }

  try {
    const metadataRes = await drive.files.get({
      fileId,
      fields: 'name, mimeType',
    })

    const fileStream = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    )

    res.setHeader('Content-Disposition', `inline; filename="${metadataRes.data.name}"`)
    res.setHeader('Content-Type', metadataRes.data.mimeType || 'application/octet-stream')

    ;(fileStream.data as Readable).pipe(res)
  } catch (err) {
    console.error('File stream error:', err)
    res.status(404).send('File not found')
  }
}
