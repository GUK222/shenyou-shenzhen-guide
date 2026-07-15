import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;

  return {
    title: "深游 SHENYOU｜深圳旅游解说 App",
    description: "基于深圳旅游解说资料整理的手机端景点导览、收藏与语音讲解应用。",
    applicationName: "深游",
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: "深游", statusBarStyle: "black-translucent" },
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "深游 SHENYOU",
      description: "把深圳景点，装进口袋里。",
      type: "website",
      images: [{ url: imageUrl, width: 1733, height: 907, alt: "深游 SHENYOU 深圳景点随身讲解" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "深游 SHENYOU",
      description: "深圳景点随身讲解",
      images: [imageUrl],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f6f4" },
    { media: "(prefers-color-scheme: dark)", color: "#101715" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
