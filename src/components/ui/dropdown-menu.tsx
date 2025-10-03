"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  className?: string
  asChild?: boolean
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  className?: string
  align?: "start" | "center" | "end"
  sideOffset?: number
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  className?: string
  asChild?: boolean
  inset?: boolean
}

const DropdownMenuContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {}
})

const DropdownMenu = ({ children }: DropdownMenuProps) => {
  const [open, setOpen] = React.useState(false)

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuTriggerProps
>(({ children, className, asChild, ...props }, ref) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext)

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        setOpen(!open)
      },
      ref
    } as any)
  }

  return (
    <button
      ref={ref}
      className={cn("", className)}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(({ children, className, align = "start", sideOffset = 4, ...props }, ref) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.dropdown-menu-container')) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      ref={ref}
      className={cn(
        "dropdown-menu-container absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-neutral-900 shadow-md",
        align === "start" && "left-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "end" && "right-0",
        className
      )}
      style={{ top: `calc(100% + ${sideOffset}px)` }}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuItemProps
>(({ children, className, asChild, inset, ...props }, ref) => {
  const { setOpen } = React.useContext(DropdownMenuContext)

  const handleClick = () => {
    setOpen(false)
  }

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        handleClick()
        // Si c'est un Link, on laisse le navigateur gérer la navigation
        if (children && typeof children === 'object' && 'props' in children && (children.props as any).href) {
          setTimeout(() => {
            window.location.href = (children.props as any).href
          }, 100)
        }
      },
      ref
    } as any)
  }

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-neutral-100 focus:bg-neutral-100",
        inset && "pl-8",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuItem.displayName = "DropdownMenuItem"

// Composants non utilisés mais exportés pour compatibilité
const DropdownMenuGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuSub = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuRadioGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuSubTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuSubContent = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuCheckboxItem = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuRadioItem = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuLabel = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuSeparator = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuShortcut = ({ children }: { children: React.ReactNode }) => <>{children}</>

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
