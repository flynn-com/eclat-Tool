import type { Metadata } from 'next';
import { Nunito_Sans, Inter } from 'next/font/google';
import './globals.css';

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Firmen-Tool',
  description: 'Internes Management-Tool',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${nunitoSans.variable} ${inter.variable} h-full`}>
      <body className="h-full antialiased" style={{ fontFamily: 'var(--font-body), sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
