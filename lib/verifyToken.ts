import type { NextApiRequest } from 'next'
import supabase from './supabaseClient'

export async function verifyToken(req: NextApiRequest) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return null

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user?.email) return null

  return data.user
}