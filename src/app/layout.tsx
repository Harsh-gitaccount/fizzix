import type { Metadata, Viewport } from 'next'
import { Source_Serif_4 } from 'next/font/google'
import './globals.css'

const serif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
  variable: '--font-serif',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://fizzix.app'),
  title: 'Fizzix - Free Physics Lab for Students',
  description:
    'Interactive physics simulations for Class 6-12. No login. No download. Works offline.',
  manifest: '/manifest.json',
  appleWebApp: {
    statusBarStyle: 'default',
    title: 'Fizzix',
  },
  openGraph: {
    title: 'Fizzix - Free Physics Lab for Students',
    description: 'Interactive physics simulations for Class 6-12. No login. No download. Works offline.',
    type: 'website',
    images: [{ url: '/og/projectile-motion.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fizzix - Free Physics Lab for Students',
    description: 'Interactive physics simulations for Class 6-12. No login. No download. Works offline.',
    images: ['/og/projectile-motion.svg'],
  },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/icon-192.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <script
          defer
          data-domain="fizzix.app"
          src="https://plausible.io/js/script.js"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if(typeof ResizeObserver==='undefined'){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@juggle/resize-observer@3/lib/exports/resize-observer.umd.min.js';s.onload=function(){window.ResizeObserver=window.ResizeObserver||ResizeObserver};document.head.appendChild(s)}`,
          }}
        />
      </head>
      <body className={`antialiased ${serif.variable}`}>
        <noscript>
          <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui' }}>
            <h1>Fizzix requires JavaScript</h1>
            <p>Please enable JavaScript in your browser to use this physics simulation.</p>
          </div>
        </noscript>
        {children}
      </body>
    </html>
  )
}
