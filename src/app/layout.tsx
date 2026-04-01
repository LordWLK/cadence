import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Cadence — Planifie ta semaine",
  description: "Planifie ta semaine, suis ton humeur, ne rate aucun match. Disponible sur iPhone.",
  keywords: ["planning", "humeur", "sport", "semaine", "bien-etre"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cadence",
    startupImage: [
      { url: "/icons/icon-512.png" },
    ],
  },
  icons: {
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
    ],
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Cadence — Planifie ta semaine",
    description: "Planifie ta semaine, suis ton humeur, ne rate aucun match.",
    type: "website",
    locale: "fr_FR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#8b5cf6",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen pb-safe">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
