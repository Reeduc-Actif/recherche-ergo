import Link from 'next/link'
import PartnerLogosMarquee from './partner-logos-marquee'
import QuickContactForm from './quick-contact-form'

export default function Footer() {
  return (
    <footer className="bg-neutral-50 border-t">
      {/* Carrousel de logos partenaires */}
      <div className="container py-12">
        <PartnerLogosMarquee />
      </div>

      {/* Section contact rapide */}
      <div className="container py-12">
        <QuickContactForm />
      </div>

      {/* Footer basique */}
      <div className="border-t bg-white">
        <div className="container py-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
            <div className="space-y-2">
              <p className="font-semibold text-lg">ErgoConnect</p>
              <p className="text-sm text-neutral-600">
                © {new Date().getFullYear()} ErgoConnect — Tous droits réservés
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-600">
              <Link href="/mentions-legales" className="hover:text-primary transition-colors">
                Mentions légales
              </Link>
              <Link href="/confidentialite" className="hover:text-primary transition-colors">
                Confidentialité
              </Link>
              <Link href="/cgu" className="hover:text-primary transition-colors">
                CGU
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
