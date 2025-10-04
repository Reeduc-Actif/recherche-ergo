'use client'

import { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Step {
  id: string
  title: string
  description?: string
  content: ReactNode
}

interface StepWizardProps {
  steps: Step[]
  currentStep: number
  onStepChange?: (step: number) => void
  className?: string
}

export default function StepWizard({ 
  steps, 
  currentStep, 
  onStepChange,
  className = '' 
}: StepWizardProps) {
  return (
    <div className={`space-y-8 ${className}`}>
      {/* Indicateur des étapes */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors cursor-pointer ${
                  index < currentStep
                    ? 'bg-primary border-primary text-primary-foreground'
                    : index === currentStep
                    ? 'border-primary text-primary'
                    : 'border-neutral-300 text-neutral-400'
                }`}
                onClick={() => onStepChange?.(index)}
              >
                {index < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-0.5 transition-colors ${
                    index < currentStep ? 'bg-primary' : 'bg-neutral-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Titre de l'étape actuelle */}
      <div className="text-center">
        <h3 className="text-xl font-semibold">{steps[currentStep]?.title}</h3>
        {steps[currentStep]?.description && (
          <p className="text-neutral-600 mt-2">{steps[currentStep].description}</p>
        )}
      </div>

      {/* Contenu de l'étape actuelle */}
      <Card>
        <CardContent className="p-6">
          {steps[currentStep]?.content}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => onStepChange?.(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
        >
          Précédent
        </button>
        
        <div className="text-sm text-neutral-600">
          Étape {currentStep + 1} sur {steps.length}
        </div>
        
        <button
          onClick={() => onStepChange?.(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
        >
          Suivant
        </button>
      </div>
    </div>
  )
}
