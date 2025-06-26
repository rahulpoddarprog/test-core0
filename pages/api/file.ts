import { google } from 'googleapis'
import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const fileId = req.query.fileId as string
  if (!fileId) return res.status(400).send('Missing fileId')

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), 'credentials.json'),
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    })

    const drive = google.drive({ version: 'v3', auth })

    const metadata = await drive.files.get({
      fileId,
      fields: 'name, mimeType',
    })

    const fileStream = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    )

    res.setHeader('Content-Disposition', `inline; filename="${metadata.data.name}"`)
    res.setHeader('Content-Type', metadata.data.mimeType || 'application/octet-stream')
    fileStream.data.pipe(res)

  } catch (err: any) {
    console.error('❌ Streaming error:', JSON.stringify(err, null, 2))
    res.status(404).send('File not found or access denied')
  }
}