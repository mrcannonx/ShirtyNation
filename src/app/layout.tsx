import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://shirtynation.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#E8630A",
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "ShirtyNation — The Largest Selection of Shirts in Every Niche",
    template: "%s | ShirtyNation",
  },
  description:
    "Thousands of unique shirt designs across every niche. Funny, motivational, vintage, gaming, dad jokes and more. Premium quality, shipped to your door.",
  keywords: [
    "t-shirts",
    "funny shirts",
    "graphic tees",
    "motivational shirts",
    "vintage tees",
    "gaming shirts",
    "dad joke shirts",
    "coding shirts",
    "custom shirts",
    "ShirtyNation",
  ],
  authors: [{ name: "ShirtyNation" }],
  creator: "ShirtyNation",
  publisher: "ShirtyNation",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "ShirtyNation",
    title: "ShirtyNation — The Largest Selection of Shirts in Every Niche",
    description:
      "Thousands of unique shirt designs across every niche. Premium quality, shipped to your door.",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "ShirtyNation — Shirts for Every Niche",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShirtyNation — The Largest Selection of Shirts in Every Niche",
    description:
      "Thousands of unique shirt designs across every niche. Premium quality, shipped to your door.",
    images: [`${BASE_URL}/og-image.png`],
    creator: "@ShirtyNation",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#0A0A0A] text-[#F5F5F5]">
        {children}
      </body>
    </html>
  );
}
