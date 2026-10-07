import type { Metadata, Viewport } from "next";
import { Oswald, Poppins } from "next/font/google";
import "./globals.css";

// Tipografies com la web del club: titulars estrets en majúscules + Poppins per al text.
const display = Oswald({
  variable: "--font-oswald",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

const sans = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Control de Readaptació", template: "%s · Readaptació" },
  description: "Seguiment de jugadors lesionats: wellness, sessions, treball de camp i tests físics.",
  icons: { icon: "/favicon.png", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Readaptació", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a2ea0" },
    { media: "(prefers-color-scheme: dark)", color: "#0a2ea0" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ca" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
