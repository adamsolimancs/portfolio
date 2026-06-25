import type { Metadata } from "next";
import "@/index.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://adamesoliman.com"),
  title: "Adam Soliman",
  description:
    "Full-Stack Developer & NYU CS Honors specializing in modern, clean, and user-centered digital experiences.",
  authors: [{ name: "Adam Soliman" }],
  keywords: [
    "Adam Soliman",
    "adamsoliman",
    "adamesoliman",
    "Software Developer",
    "AI",
    "Machine Learning",
    "Full Stack",
    "Portfolio",
  ],
  openGraph: {
    title: "Adam Soliman - Full-Stack Developer & NYU CS Honors",
    description:
      "Full-Stack Developer & NYU CS Honors specializing in modern, clean, and user-centered digital experiences.",
    type: "website",
    url: "https://adamesoliman.com",
    locale: "en_US",
    images: [{ url: "/logo.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Adam Soliman - Full-Stack Developer & NYU CS Honors",
    description:
      "Full-Stack Software & AI Developer specializing in modern, clean, and user-centered digital experiences.",
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
      </body>
    </html>
  );
}
