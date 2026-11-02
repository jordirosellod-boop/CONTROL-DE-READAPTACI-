import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import { RegistraSW } from "@/components/pwa";
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

// Mides (amplada, alçada, densitat) de les imatges de public/splash
const SPLASH: [number, number, number][] = [
  [430, 932, 3], [393, 852, 3], [390, 844, 3], [428, 926, 3], [414, 896, 2], [375, 812, 3], [375, 667, 2],
  [414, 736, 3], [820, 1180, 2], [834, 1194, 2], [1024, 1366, 2], [810, 1080, 2], [744, 1133, 2],
];

export const metadata: Metadata = {
  title: { default: "Control de Readaptació", template: "%s · Readaptació" },
  description: "Seguiment de jugadors lesionats: wellness, sessions, treball de camp i tests físics.",
  icons: { icon: "/favicon.png", apple: "/apple-touch-icon.png" },
  // black-translucent: l'app ocupa tota la pantalla i la barra blava passa per sota de l'hora
  appleWebApp: {
    capable: true,
    title: "Readaptació",
    statusBarStyle: "black-translucent",
    // Pantalla d'arrencada (escut sobre blau) per a cada mida d'iPhone/iPad
    startupImage: SPLASH.map(([w, h, d]) => ({
      url: `/splash/splash-${w}x${h}@${d}x.png`,
      media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${d}) and (orientation: portrait)`,
    })),
  },
};

export const viewport: Viewport = {
  // Ocupa tota la pantalla (també la zona de l'hora i la "notch"); els marges segurs es fan amb env(safe-area-inset-*)
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a2ea0" },
    { media: "(prefers-color-scheme: dark)", color: "#0a2ea0" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Tema triat a "El meu compte" (clar / fosc); sense cookie segueix el del mòbil
  const tema = (await cookies()).get("tema")?.value;
  return (
    <html lang="ca" data-theme={tema === "light" || tema === "dark" ? tema : undefined} className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <RegistraSW />
      </body>
    </html>
  );
}
