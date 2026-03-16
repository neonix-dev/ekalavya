import type { Metadata } from "next";
import { DM_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const mono = DM_Mono({
  variable: "--font-mono",
  weight: ["300", "400", "500"],
  subsets: ["latin"],
});

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ekalavya \u2014 The Silent Mirror",
  description: "Play. The mirror listens. Ekalavya reflects your raga in real time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${mono.variable} ${serif.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
