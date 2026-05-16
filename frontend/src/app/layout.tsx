import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GesConge — Gestion des Congés',
  description: 'Système de gestion des congés pour équipes de quart A/B/C/D',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GesConge',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#1d4ed8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={cairo.variable}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans bg-slate-50 min-h-screen">
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: { fontFamily: 'var(--font-cairo), sans-serif', fontSize: '14px' },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
