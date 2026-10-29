import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiveStats · Dereck's listening",
  description:
    "A personal Spotify Wrapped-style portfolio — top artists, listening habits, sessions, and song recommendations.",
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
