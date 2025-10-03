import { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

interface FormFieldProps {
  label: string
  children: ReactNode
  required?: boolean
  className?: string
  error?: string
}

export default function FormField({ label, children, required = false, className = '', error }: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
