'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function SiteHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  // Charger l'utilisateur depuis Supabase (cookies)
  useEffect(() => {
    const sb = supabaseBrowser()
    sb.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  // Fermer le menu quand on change de page
  useEffect(() => { setOpen(false) }, [pathname])

  // Esc pour fermer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">
            ErgoConnect
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5 text-sm">
            <Link href="/recherche" className="hover:underline">Recherche</Link>
            <Link href="/amenagement" className="hover:underline">Aménagement</Link>
            <Link href="/pro" className="hover:underline">Je suis Ergo</Link>
            <Link href="/contact" className="hover:underline">Contact</Link>

            {/* ✅ Affiche Mon espace si connecté */}
            {user && (
              <Link href="/pro/mon-profil" className="btn">
                Mon espace
              </Link>
            )}
          </nav>

          {/* Burger mobile */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-lg border p-2 text-sm"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Panneau mobile */}
        <div className={`md:hidden ${open ? 'block' : 'hidden'}`}>
          <nav
            id="mobile-nav"
            className="border-t bg-white"
            onClick={() => setOpen(false)}
          >
            <div className="container flex flex-col gap-2 py-3 text-sm">
              <Link className="py-2 hover:underline" href="/recherche">Recherche</Link>
              <Link className="py-2 hover:underline" href="/amenagement">Aménagement</Link>
              <Link className="py-2 hover:underline" href="/pro">Je suis Ergo</Link>
              <Link className="py-2 hover:underline" href="/contact">Contact</Link>

              {/* ✅ version mobile */}
              {user && (
                <Link className="py-2 hover:underline font-medium" href="/pro/mon-profil">
                  Mon espace
                </Link>
              )}
            </div>
          </nav>
        </div>
      </header>
    </>
  )
}
