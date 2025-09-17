// src/app/layout.tsx
import "./globals.css"
import { ReactNode } from "react"
import Link from "next/link"

export const metadata = {
  title: "ErgoConnect — Trouvez un ergothérapeute en Belgique",
  description: "Carte interactive, filtres par spécialités, langues et modalités, prise de rendez-vous en ligne.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh bg-white text-neutral-900 antialiased">
        <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
          <div className="container h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold tracking-tight">
              ErgoConnect
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              <Link href="/recherche" className="hover:underline">Recherche</Link>
              <Link href="/amenagement" className="hover:underline">Aménagement</Link>
              <Link href="/pro" className="hover:underline">Je suis Ergo</Link>
              <Link href="/contact" className="hover:underline">Contact</Link>
            </nav>
          </div>
        </header>

        <div className="container py-10">{children}</div>

        <footer className="mt-16 border-t">
          <div className="container py-8 text-sm text-neutral-600">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
              <p>© {new Date().getFullYear()} ErgoConnect — Rééduc’Actif</p>
              <div className="flex gap-4">
                <Link href="/mentions-legales" className="hover:underline">Mentions légales</Link>
                <Link href="/confidentialite" className="hover:underline">Confidentialité</Link>
                <Link href="/cgu" className="hover:underline">CGU</Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
