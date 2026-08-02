import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "@/index.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://adamesoliman.com"),
  title: {
    default: "Adam Soliman | Full-Stack & AI Developer",
    template: "%s | Adam Soliman",
  },
  description:
    "Adam Soliman is an NYU computer science student and full-stack developer focused on AI, machine learning, and user-centered digital experiences.",
  applicationName: "Adam Soliman",
  authors: [{ name: "Adam Soliman" }],
  creator: "Adam Soliman",
  publisher: "Adam Soliman",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "Adam Soliman",
    "adamsoliman",
    "adamesoliman",
    "Full-Stack Developer",
    "AI Developer",
    "Machine Learning",
    "NYU Computer Science",
    "Software Developer Portfolio",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "Adam Soliman | Full-Stack & AI Developer",
    description:
      "NYU computer science student and full-stack developer focused on AI, machine learning, and user-centered digital experiences.",
    type: "website",
    url: "/",
    siteName: "Adam Soliman",
    locale: "en_US",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 1024,
        alt: "Adam Soliman",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Adam Soliman | Full-Stack & AI Developer",
    description:
      "NYU computer science student and full-stack developer focused on AI, machine learning, and user-centered digital experiences.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
