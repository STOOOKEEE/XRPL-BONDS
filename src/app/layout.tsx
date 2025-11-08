import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { QueryProvider } from "@/providers/query-provider"
import { WalletProvider } from "@/context/WalletContext"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "XRPL Corporate Bonds | Tokenized Corporate Bonds",
  description: "Invest in tokenized corporate bonds on XRPL testnet",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/logo.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon.ico",
        sizes: "any",
      },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/logo.png?v=2" />
        <link rel="shortcut icon" href="/logo.png?v=2" />
        <link rel="apple-touch-icon" href="/logo.png?v=2" />
      </head>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <WalletProvider>
          <QueryProvider>{children}</QueryProvider>
        </WalletProvider>
        <Analytics />
      </body>
    </html>
  )
}
