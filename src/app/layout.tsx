import "./globals.css"
import { ReactNode } from "react"
import Link from "next/link"
import SiteHeader from "@/components/ui/site-header"
import SupabaseAuthListener from '@/lib/supabase-auth-listener'

export const metadata = {
  title: "ErgoConnect — Trouvez un ergothérapeute en Belgique",
  description:
    "Carte interactive, filtres par spécialités, langues et modalités, prise de rendez-vous en ligne.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh bg-white text-neutral-900 antialiased">
        <SiteHeader />

        <div className="container py-8 sm:py-10">{children}</div>

        <SupabaseAuthListener />

        <footer className="mt-16 border-t">
          <div className="container py-8 text-sm text-neutral-600">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
              <p>© {new Date().getFullYear()} ErgoConnect — Tous droits réservés</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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
