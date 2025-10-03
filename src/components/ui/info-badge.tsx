import { ReactNode } from 'react'
import { AlertCircle, Info } from 'lucide-react'

interface InfoBadgeProps {
  children: ReactNode
  type?: 'info' | 'warning'
  className?: string
}

export default function InfoBadge({ children, type = 'info', className = '' }: InfoBadgeProps) {
  const icon = type === 'warning' ? <AlertCircle className="h-4 w-4" /> : <Info className="h-4 w-4" />
  const bgColor = type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-blue-50 border-blue-200 text-blue-800'
  
  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border p-3 text-sm ${bgColor} ${className}`}>
      {icon}
      {children}
    </div>
  )
}
