import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ruhiyat — Administrator Panel',
  description: 'Education center management panel for Ruhiyat mental wellness ecosystem',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
