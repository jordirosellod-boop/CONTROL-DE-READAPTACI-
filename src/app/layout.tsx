import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Tipografies de la web del club: Escapulada (titulars) + Poppins (text).
const display = localFont({
  src: "./fonts/Escapulada.ttf",
  variable: "--font-escapulada",
  weight: "700",
  display: "swap",
  fallback: ["Arial Narrow", "sans-serif"],
  // L'Escapulada es veu petita al mateix cos que altres lletres: l'engrandim una mica
  declarations: [{ prop: "size-adjust", value: "115%" }],
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
