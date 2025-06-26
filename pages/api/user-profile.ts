import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    const { data, error } = await supabase
      .from('users')
      .select('petitionerphase, petitionerserialno, name, contactnumber, department, collegeroll, universityroll')
      .eq('email', email)
      .single()

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    return res.status(200).json({ success: true, data })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}
