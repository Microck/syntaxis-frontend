import type { Metadata } from 'next';
import './globals.css';
import './syntaxis.css';
import './workspace.css';
import './motion.css';
import { Providers } from '@/components/syntaxis/providers';
export const metadata: Metadata = {
  title: 'Syntaxis — Your work. Well told.',
  description: 'Build a résumé worth reading. Three templates, live editing, saved versions, and PDF and LaTeX exports. No account required.',
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" style={{ colorScheme: 'light' }}><body className="antialiased"><Providers>{children}</Providers></body></html>;
}
