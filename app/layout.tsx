import type { Metadata } from 'next';
import { Layout } from '@/components/Layout';
import { CompareProvider } from '@/context/CompareContext';
import './styles/tokens.css';
import './styles/global.css';

export const metadata: Metadata = {
  title: 'Bazariyaa',
  description: 'India’s honest product-discovery platform. Real reviews, live price history and a score you can trust.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <CompareProvider>
          <Layout>{children}</Layout>
        </CompareProvider>
      </body>
    </html>
  );
}
