import { useState } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UploadFieldProps {
  label: string
  accept?: string
  multiple?: boolean
  onFilesChange?: (files: File[]) => void
  className?: string
}

export default function UploadField({ 
  label, 
  accept = "*/*", 
  multiple = false, 
  onFilesChange,
  className = '' 
}: UploadFieldProps) {
  const [files, setFiles] = useState<File[]>([])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const newFiles = multiple ? [...files, ...selectedFiles] : selectedFiles
    setFiles(newFiles)
    onFilesChange?.(newFiles)
  }

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onFilesChange?.(newFiles)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium">{label}</label>
      
      <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
          <p className="text-sm text-neutral-600">
            Cliquez pour télécharger ou glissez-déposez vos fichiers
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {accept === "*/*" ? "Tous types de fichiers acceptés" : `Types acceptés: ${accept}`}
          </p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Fichiers sélectionnés :</p>
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-neutral-50 rounded-lg p-2">
              <span className="text-sm text-neutral-700 truncate flex-1">
                {file.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
