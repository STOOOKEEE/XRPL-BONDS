"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { WalletButton } from "./wallet-button"

export function Header() {
  const pathname = usePathname()

  const links = [
    { href: "/invest", label: "Invest" },
    { href: "/marketplace", label: "Marketplace (beta)" },
    { href: "/corpo", label: "Issue bond" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <img 
            src="/logo.png" 
            alt="XRPL Corporate Bonds" 
            className="h-8 w-8"
          />
          <span className="hidden sm:inline">XRPL Corporate Bonds</span>
        </Link>

        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === link.href ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <WalletButton />
        </div>
      </div>
    </header>
  )
}
