import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

interface FileMetadata {
  tnx_id?: string
  amount?: number
  payment_date?: string
  paid_to?: string
  remark?: string
}

interface FileWithMetadata {
  id: string
  name: string
  metadata: FileMetadata | null
}

export default function Dashboard() {
  const router = useRouter()
  const [userHtml, setUserHtml] = useState<string>('Loading your data...')

  const logout = () => {
    localStorage.clear()
    router.push('/')
  }

  useEffect(() => {
    const token = localStorage.getItem('userToken')
    const email = localStorage.getItem('userEmail')

    if (!token || !email) {
      setUserHtml('⚠️ Not logged in.')
      return
    }

    const fetchData = async () => {
      try {
        const [profileRes, filesRes] = await Promise.all([
          fetch('/api/user-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ email }),
          }),
          fetch('/api/user-files', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ email }),
          }),
        ])

        const userProfile = await profileRes.json()
        const userFiles = await filesRes.json()

        if (!userProfile.success || !userFiles.success) {
          setUserHtml('❌ Failed to load data.')
          return
        }

        const user = userProfile.data
        const files: FileWithMetadata[] = userFiles.files

        let html = `
          <p><strong>Name:</strong> ${user.name}</p>
          <p><strong>Phase:</strong> ${user.petitionerphase}</p>
          <p><strong>Serial No:</strong> ${user.petitionerserialno}</p>
          <p><strong>Dept:</strong> ${user.department}</p>
          <p><strong>College Roll:</strong> ${user.collegeroll}</p>
          <p><strong>University Roll:</strong> ${user.universityroll}</p>
          <h3>Drive Images:</h3>
        `

        files.forEach(file => {
          html += `
            <div style="margin-top:1rem; border:1px solid #ccc; padding:10px;">
              <img src="/api/file?fileId=${file.id}" alt="${file.name}" style="max-width:100%;">
              <div style="margin-top:0.5rem; font-size:14px;">
                <strong>TNX ID:</strong> ${file.metadata?.tnx_id || 'N/A'}<br>
                <strong>Amount:</strong> ₹${file.metadata?.amount || 'N/A'}<br>
                <strong>Date:</strong> ${file.metadata?.payment_date || 'N/A'}<br>
                <strong>Paid To:</strong> ${file.metadata?.paid_to || 'N/A'}<br>
                <strong>Remark:</strong> ${file.metadata?.remark || 'N/A'}<br>
              </div>
            </div>
          `
        })

        setUserHtml(html)
      } catch (err) {
        console.error(err)
        setUserHtml('❌ Error loading data.')
      }
    }

    fetchData()
  }, [])

  return (
    <main style={{ padding: '2rem' }}>
      <h2>User Dashboard</h2>
      <div dangerouslySetInnerHTML={{ __html: userHtml }} />
      <br />
      <button onClick={logout}>Logout</button>
    </main>
  )
}
