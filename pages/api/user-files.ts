import type { NextApiRequest, NextApiResponse } from 'next'
import supabase from '@/lib/supabaseClient'
import { verifyToken } from '@/lib/verifyToken'
import { drive } from '@/lib/drive'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')

  const user = await verifyToken(req)
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' })

  const { email } = req.body

  try {
    const folderRes = await drive.files.list({
      q: `name contains '${email}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
    })

    const folders = folderRes.data.files
    if (!folders || folders.length === 0) return res.json({ success: true, files: [] })

    const folderId = folders[0].id

    const fileRes = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
      fields: 'files(id, name)',
    })

    const files = fileRes.data.files || []

    const filesWithMetadata = await Promise.all(
      files.map(async (file) => {
        try {
          const { data, error } = await supabase
            .from('files')
            .select('tnx_id, amount, payment_date, paid_to, remark')
            .eq('filename', file.name)
            .single()

          return {
            id: file.id,
            name: file.name,
            metadata: error ? null : data,
          }
        } catch {
          return { id: file.id, name: file.name, metadata: null }
        }
      })
    )

    return res.status(200).json({ success: true, files: filesWithMetadata })
  } catch (err) {
    console.error('Drive fetch error:', err)
    return res.status(500).json({ success: false, error: 'File load error' })
  }
}