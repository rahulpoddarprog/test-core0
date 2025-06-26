import type { NextApiRequest, NextApiResponse } from 'next'
import supabase from '@/lib/supabaseClient'
import { verifyToken } from '@/lib/verifyToken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')

  const user = await verifyToken(req)
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' })

  const { email } = req.body

  const { data, error } = await supabase
    .from('petitioners')
    .select('name,petitionphase,petitioneserialnumber,department,collegeroll,universityroll,dateofbirth,dateofadmission,contactnumber,gender,tfwstatus,parentsname,parentscontact')
    .eq('email', email)
    .single()

  if (error || !data) return res.status(404).json({ success: false, error: 'User not found' })

  res.status(200).json({ success: true, data })
}