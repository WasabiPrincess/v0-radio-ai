import type React from "react"
import type { Metadata } from "next"
import { Noto_Sans_JP } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

// Initialize fonts
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
})

export const metadata: Metadata = {
  title: "またねcast",
  description: "AIラジオパーソナリティふわりと一緒に、大切な人との記憶をお話ししましょう",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`font-sans antialiased ${notoSansJP.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
