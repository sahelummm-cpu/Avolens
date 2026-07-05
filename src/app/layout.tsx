import type { Metadata, Viewport } from 'next';
import { Poppins, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/lib/store';

const display = Poppins({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
});

const body = Plus_Jakarta_Sans({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'AvoLens — Snap it. AvoLens tracks it.',
  description: 'Effortless calorie & macro tracking. Just point your camera at the plate.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f7f3' },
    { media: '(prefers-color-scheme: dark)', color: '#12160f' },
  ],
};

// Runs before hydration so the theme is correct on first paint (no flash).
const noFlashScript = `
(function () {
  try {
    var raw = window.localStorage.getItem('avolens.state.v1');
    var mode = raw ? (JSON.parse(raw).themeMode || 'auto') : 'auto';
    var sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = mode === 'dark' || (mode === 'auto' && sysDark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body suppressHydrationWarning>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
