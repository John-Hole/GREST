import '../styles/design-tokens.css';
import '../styles/globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { ToastProvider } from '@/components/Toast';
import { NavProvider } from '@/components/NavContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ForcePasswordChangeWrapper from '@/components/ForcePasswordChangeWrapper';

export const metadata = {
  title: 'Grest PSG',
  description: 'Sistema gestione Grest PSG',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico?v=2',
    shortcut: '/favicon.ico?v=2',
    apple: '/apple-icon.png?v=2',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Grest PSG',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: '#1565C0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <NavProvider>
              <div className="app-container">
                <Navbar />
                <Sidebar />
                <main className="main-content">
                  {children}
                </main>
              </div>
              <ForcePasswordChangeWrapper />
            </NavProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
