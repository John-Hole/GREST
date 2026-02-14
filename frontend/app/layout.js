import '../styles/design-tokens.css';
import '../styles/globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { ToastProvider } from '@/components/Toast';
import { NavProvider } from '@/components/NavContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: 'Grest PSG',
  description: 'Sistema gestione Grest PSG',
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
            </NavProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
