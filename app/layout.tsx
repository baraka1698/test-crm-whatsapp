import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ReliaPay — Micro-CRM WhatsApp',
  description:
    'Gérez vos clients, commandes, paiements et relances via WhatsApp. Suivez les soldes dus et relancez en un tap.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ReliaPay',
  },
  openGraph: {
    title: 'ReliaPay — Micro-CRM WhatsApp',
    description:
      'Gérez vos clients, commandes, paiements et relances via WhatsApp.',
    type: 'website',
  },
};

export const viewport = {
  themeColor: '#25D366',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          {children}
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
