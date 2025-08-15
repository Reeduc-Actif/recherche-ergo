// src/app/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold">Rééduc’Connect</h1>
      <p className="text-neutral-600">
        Trouvez un ergothérapeute par spécialité et localisation, puis prenez
        rendez‑vous en ligne.
      </p>
      <div className="flex items-center gap-3">
        <Link href="/recherche">
          <Button>Commencer la recherche</Button>
        </Link>
        <Link href="/pro">
          <Button variant="outline">Espace professionnel</Button>
        </Link>
      </div>
    </main>
  )
}
