import { useState } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const router = useRouter()

  const login = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setStatusMsg(`❌ Login failed: ${error.message}`)
      return
    }

    const token = data?.session?.access_token
    if (!token) {
      setStatusMsg('❌ Token missing.')
      return
    }

    localStorage.setItem('userToken', token)
    localStorage.setItem('userEmail', email)
    setStatusMsg('✅ Login successful!')
    router.push('/dashboard')
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h2>Login</h2>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <br />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <br />
      <button onClick={login}>Login</button>
      <p>{statusMsg}</p>
    </main>
  )
}