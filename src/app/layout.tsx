import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShirtyNation — The Largest Selection of Shirts in Every Niche",
  description:
    "Thousands of unique shirt designs across every niche. Funny, motivational, vintage, gaming, dad jokes and more. Premium quality, shipped to your door.",
  openGraph: {
    title: "ShirtyNation",
    description: "The largest selection of shirts in every niche.",
    type: "website",
  },
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
