'use client'
import { useEffect, useRef, useState } from 'react'

type CityOption = { nis_code: number; label: string }

export type CityPickerProps = {
  value: Array<number | string>            // NIS list
  onChange: (next: Array<number | string>) => void
  placeholder?: string
  locale?: 'fr' | 'nl' | 'de'
}

export default function CityPicker({ value, onChange, placeholder = 'Rechercher une commune…', locale = 'fr' }: CityPickerProps) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<CityOption[]>([])
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
      const url = `/api/best/municipalities?q=${encodeURIComponent(term)}&page=1`
      const res = await fetch(url)
      if (!res.ok) { setOptions([]); return }
      const json: { items: Array<{ nis_code: number; name_fr?: string; name_nl?: string; name_de?: string }> } = await res.json()
      const opts = (json.items ?? []).map(m => {
        const label = m?.[`name_${locale}`] ?? m?.name_fr ?? m?.name_nl ?? m?.name_de ?? `${m.nis_code}`
        return { nis_code: Number(m.nis_code), label }
      }) as CityOption[]
      setOptions(opts)
      setOpen(true)
    }, 250)
    return () => { if (timer.current) window.clearTimeout(timer.current) }
  }, [q, locale])

  const toggle = (nis: number) => {
    const has = value.map(Number).includes(nis)
    onChange(has ? value.filter(v => Number(v) !== nis) : [...value, nis])
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
        aria-controls="city-picker-listbox"
      />
      {open && options.length > 0 && (
        <div id="city-picker-listbox" className="absolute z-20 mt-1 w-full rounded-lg border bg-white shadow" role="listbox">
          {options.map(opt => {
            const checked = value.map(Number).includes(opt.nis_code)
            return (
              <button
                key={opt.nis_code}
                type="button"
                role="option"
                aria-selected={checked}
                onClick={() => toggle(opt.nis_code)}
                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-neutral-50"
              >
                <span className="text-sm">{opt.label}</span>
                {checked && <span className="text-xs text-neutral-500">sélectionné</span>}
              </button>
            )
          })}
        </div>
      )}

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map(v => (
            <span key={String(v)} className="inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-xs">
              {String(v)}
              <button
                type="button"
                className="text-neutral-500"
                onClick={() => onChange(value.filter(x => String(x) !== String(v)))}
                aria-label={`Remove ${String(v)}`}
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
