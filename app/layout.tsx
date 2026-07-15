import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "深游 SHENYOU｜深圳旅游解说 App",
  description: "基于深圳旅游解说资料整理的手机端景点导览、收藏与语音讲解应用。",
  applicationName: "深游",
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: { capable: true, title: "深游", statusBarStyle: "black-translucent" },
  icons: {
    icon: `${basePath}/favicon.svg`,
    shortcut: `${basePath}/favicon.svg`,
  },
  openGraph: {
    title: "深游 SHENYOU",
    description: "把深圳景点，装进口袋里。",
    type: "website",
    images: [{ url: `${basePath}/og.png`, width: 1733, height: 907, alt: "深游 SHENYOU 深圳景点随身讲解" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "深游 SHENYOU",
    description: "深圳景点随身讲解",
    images: [`${basePath}/og.png`],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f6f4" },
    { media: "(prefers-color-scheme: dark)", color: "#101715" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
