'use client'
import { Toaster } from 'react-hot-toast'

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: { fontSize: '13px', maxWidth: '360px' },
        success: { iconTheme: { primary: '#3d7a2e', secondary: '#fff' } },
        error:   { iconTheme: { primary: '#c0392b', secondary: '#fff' } },
      }}
    />
  )
}
