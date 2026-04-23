'use client';

import './globals.css';
import Sidebar from '@/components/Sidebar';
import { ToastProvider } from '@/components/ToastProvider';
import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showSidebar = pathname !== '/';

  return (
    <html lang="en" dir="ltr" className="dark">
      <head>
        <title>AI Sales CRM</title>
        <meta name="description" content="AI-Powered Sales Prospecting CRM" />
      </head>
      <body className="bg-slate-950 text-white min-h-screen">
        <ToastProvider>
          {showSidebar ? (
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 ml-64 p-8">
                {children}
              </main>
            </div>
          ) : (
            <main>
              {children}
            </main>
          )}
        </ToastProvider>
      </body>
    </html>
  );
}
