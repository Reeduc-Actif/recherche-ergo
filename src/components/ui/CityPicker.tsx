'use client'

import { useEffect, useRef, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

export type CityOption = { insee: string; name_fr: string }

export type CityPickerProps = {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}

export default function CityPicker({ value, onChange, placeholder = 'Search a Belgian city…' }: CityPickerProps) {
  const sb = supabaseBrowser()
  const [q, setQ] = useState('')
  const [options, setOptions] = useState<CityOption[]>([])
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!boxRef.current) return
      if (!boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current)
    const term = q.trim()
    timer.current = window.setTimeout(async () => {
      if (term.length < 2) { setOptions([]); return }
      const { data } = await sb
        .from('cities_be')
        .select('insee,name_fr')
        .ilike('name_fr', `%${term}%`)
        .limit(12)
      setOptions((data ?? []) as CityOption[])
      setOpen(true)
    }, 250)
    return () => { if (timer.current) window.clearTimeout(timer.current) }
  }, [q, sb])

  const toggle = (code: string) => {
    onChange(value.includes(code) ? value.filter(c => c !== code) : [...value, code])
  }

  return (
    <div className="relative" ref={boxRef}>
      <input
        className="input w-full"
        placeholder={placeholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => { if (options.length > 0) setOpen(true) }}
        role="combobox"
        aria-expanded={open}
        aria-controls="citypicker-listbox"
      />
      {open && options.length > 0 && (
        <div
          id="citypicker-listbox"
          className="absolute z-20 mt-1 w-full rounded-lg border bg-white shadow"
          role="listbox"
        >
          {options.map(opt => {
            const checked = value.includes(opt.insee)
            return (
              <button
                key={opt.insee}
                type="button"
                role="option"
                aria-selected={checked}
                onClick={() => toggle(opt.insee)}
                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-neutral-50"
              >
                <span className="text-sm">{opt.name_fr}</span>
                {checked && <span className="text-xs text-neutral-500">selected</span>}
              </button>
            )
          })}
        </div>
      )}

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map(code => (
            <span key={code} className="inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-xs">
              {code}
              <button
                type="button"
                className="text-neutral-500"
                onClick={() => onChange(value.filter(c => c !== code))}
                aria-label={`Remove ${code}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
