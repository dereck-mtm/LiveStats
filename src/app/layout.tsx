import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

const siteUrl = "https://livestats-mtm26.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "LiveStats · Dereck's listening",
  description:
    "A personal Spotify Wrapped-style portfolio — top artists, listening habits, sessions, and song recommendations.",
  openGraph: {
    title: "LiveStats · Dereck's listening",
    description:
      "My Spotify, laid out like Wrapped — tops, habits, sessions, and a recommend-a-song inbox.",
    url: siteUrl,
    siteName: "LiveStats",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "LiveStats · Dereck's listening",
    description:
      "Personal Spotify Wrapped portfolio — what I play, when I listen, what keeps coming back.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} h-full`}>
      <body className={`${GeistSans.className} min-h-full antialiased`}>
        {children}
      </body>
    </html>
  );
}
