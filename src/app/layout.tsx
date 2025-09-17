// src/app/layout.tsx
import './globals.css'
import { ReactNode } from 'react'
import Link from 'next/link'

export const metadata = {
  title: "Ergo Connect",
  description: "Trouvez un ergothérapeute et prenez RDV en ligne.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh bg-white text-neutral-900 antialiased">
        <header className="border-b">
          <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold">Ergo Connect</Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/recherche" className="hover:underline">Recherche</Link>
            </nav>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
      </body>
    </html>
  )
}
