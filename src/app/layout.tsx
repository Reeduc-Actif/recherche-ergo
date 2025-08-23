// src/app/layout.tsx
import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: "Rééduc'Connect",
  description: "Trouvez un ergothérapeute et prenez RDV en ligne.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh bg-white text-neutral-900 antialiased">
        {/* --- NAV --- */}
        <header className="border-b">
          <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
            <a href="/" className="font-semibold">Rééduc’Connect</a>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/recherche" className="hover:underline">Recherche</a>
              <a href="/onboarding" className="hover:underline">Je suis ergo</a>
              <a href="/dashboard" className="rounded border px-2 py-1 hover:bg-neutral-50">
                Mon espace
              </a>
            </nav>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
      </body>
    </html>
  )
}
