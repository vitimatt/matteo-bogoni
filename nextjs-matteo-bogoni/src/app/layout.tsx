import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Matteo Bogoni - Audio Reactive Text',
  description: 'Audio reactive text visualization with Sanity CMS integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" style={{ height: '100%', width: '100%' }}>
      <body className="antialiased" style={{ height: '100%', width: '100%', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
