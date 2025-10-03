import "./globals.css"
import { ReactNode } from "react"
import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
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
        <Header />

        <main className="container py-8 sm:py-10">{children}</main>

        <Footer />

        <SupabaseAuthListener />
      </body>
    </html>
  )
}
