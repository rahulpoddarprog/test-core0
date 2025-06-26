import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64!, 'base64').toString()),
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
})

const drive = google.drive({ version: 'v3', auth })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ success: false, error: 'Missing token' })
  }

  const { data: userData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !userData?.user?.email) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const { email } = req.body
  try {
    const folderRes = await drive.files.list({
      q: `name contains '${email}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
    })

    const folders = folderRes.data.files
    if (!folders?.length) return res.status(200).json({ success: true, files: [] })

    const folderId = folders[0].id
    const fileRes = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
      fields: 'files(id, name)',
    })

    const files = fileRes.data.files || []
    const filesWithMetadata = await Promise.all(
      files.map(async (file) => {
        let meta = null
        try {
          const { data, error } = await supabase
            .from('files')
            .select('tnx_id, amount, payment_date, paid_to, remark')
            .eq('filename', file.name)
            .single()
          if (!error) meta = data
        } catch (err) {
          console.error('Metadata lookup error:', err)
        }
        return { id: file.id, name: file.name, metadata: meta }
      })
    )

    return res.status(200).json({ success: true, files: filesWithMetadata })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, error: 'File load error' })
  }
}