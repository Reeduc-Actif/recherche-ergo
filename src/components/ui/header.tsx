'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Fermer le menu quand on change de page
  const closeMenu = () => setOpen(false)

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={closeMenu}
          aria-hidden
        />
      )}

      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-bold text-xl tracking-tight">
            ErgoConnect
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/" className="hover:text-primary transition-colors">
              Accueil
            </Link>
            <Link href="/recherche" className="hover:text-primary transition-colors">
              Recherche
            </Link>
            
            {/* Menu Suivi avec dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 hover:text-primary transition-colors">
                Suivi
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/suivi/ergotherapeute">Je suis ergothérapeute</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/suivi/bandagiste">Je suis Bandagiste</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/suivi/entrepreneur">Je suis Entrepreneur</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/suivi/patient">Je suis Patient</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/a-propos" className="hover:text-primary transition-colors">
              À propos
            </Link>
            <Link href="/contact" className="hover:text-primary transition-colors">
              Contact
            </Link>
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
            onClick={closeMenu}
          >
            <div className="container flex flex-col gap-1 py-3 text-sm">
              <Link className="py-2 hover:text-primary transition-colors" href="/">
                Accueil
              </Link>
              <Link className="py-2 hover:text-primary transition-colors" href="/recherche">
                Recherche
              </Link>
              
              {/* Menu Suivi mobile */}
              <div className="py-2">
                <div className="font-medium text-neutral-900 mb-2">Suivi</div>
                <div className="ml-4 space-y-1">
                  <Link className="block py-1 hover:text-primary transition-colors" href="/suivi/ergotherapeute">
                    Je suis ergothérapeute
                  </Link>
                  <Link className="block py-1 hover:text-primary transition-colors" href="/suivi/bandagiste">
                    Je suis Bandagiste
                  </Link>
                  <Link className="block py-1 hover:text-primary transition-colors" href="/suivi/entrepreneur">
                    Je suis Entrepreneur
                  </Link>
                  <Link className="block py-1 hover:text-primary transition-colors" href="/suivi/patient">
                    Je suis Patient
                  </Link>
                </div>
              </div>

              <Link className="py-2 hover:text-primary transition-colors" href="/a-propos">
                À propos
              </Link>
              <Link className="py-2 hover:text-primary transition-colors" href="/contact">
                Contact
              </Link>
            </div>
          </nav>
        </div>
      </header>
    </>
  )
}
