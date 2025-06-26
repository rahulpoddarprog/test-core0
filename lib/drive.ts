import { google } from 'googleapis'

const credentials = JSON.parse(
  Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64!, 'base64').toString()
)

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
})

export const drive = google.drive({ version: 'v3', auth })
