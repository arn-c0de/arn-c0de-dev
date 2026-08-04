import type { Metadata, Viewport } from 'next'
import { asset } from '@/lib/basePath'
import '@fontsource-variable/manrope'
import '@fontsource-variable/jetbrains-mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'arn-c0de — project console',
  description:
    'Embedded systems, AI agents and network security. Open source projects by arn-c0de.',
  manifest: asset('/manifest.webmanifest'),
  icons: { icon: asset('/icon.svg'), apple: asset('/icon.svg') },
  openGraph: {
    title: 'arn-c0de — project console',
    description: 'Embedded systems, AI agents and network security.',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f8fa' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0c10' },
  ],
  width: 'device-width',
  initialScale: 1,
}

/**
 * Applies the stored theme before first paint. Without this the app flashes
 * the system theme for a frame when the visitor has picked the other one.
 */
const themeBootstrap = `
try {
  var t = localStorage.getItem('theme');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
} catch (e) {}
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
