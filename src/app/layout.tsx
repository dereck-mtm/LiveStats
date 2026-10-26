import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiveStats",
  description:
    "Personal Spotify listening analytics — affinity, catalog shape, and artists that stick.",
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
