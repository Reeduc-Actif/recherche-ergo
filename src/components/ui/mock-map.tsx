import Image from 'next/image'

interface MockMapProps {
  className?: string
}

export default function MockMap({ className = '' }: MockMapProps) {
  return (
    <div className={`aspect-[4/3] w-full overflow-hidden rounded-lg bg-neutral-50 border ${className}`}>
      <Image
        src="/images/hero-map.png"
        alt="Aperçu de la recherche sur carte"
        width={960}
        height={720}
        className="h-full w-full object-cover"
      />
    </div>
  )
}
