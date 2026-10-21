import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Google_Sans } from "next/font/google"
import "./globals.css"

const googleSans = Google_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-google-sans",
  adjustFontFallback: false,
})

export const metadata: Metadata = {
  title: "Pocket Pal | GDGoC AI Pet",
  description: "Build your own AI-powered virtual pet with Genkit and Gemini.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${googleSans.variable} ${googleSans.className} antialiased`}>{children}</body>
    </html>
  )
}
