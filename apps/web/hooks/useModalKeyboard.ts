'use client'

import { useEffect, useRef, useCallback } from 'react'

interface UseModalKeyboardProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: () => Promise<void> | void
}

export function useModalKeyboard({
  isOpen,
  onClose,
  onSubmit,
}: UseModalKeyboardProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const getFocusableElements = useCallback(() => {
    if (!modalRef.current) return []
    return Array.from(
      modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[]
  }, [])

  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current = document.activeElement as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      // Fechar com Escape
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      // Enviar com Ctrl+Enter / Cmd+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        onSubmit?.()
        return
      }

      // Trap Tab dentro do modal
      if (e.key === 'Tab') {
        const focusable = getFocusableElements()
        if (focusable.length === 0) return

        const firstEl = focusable[0]
        const lastEl = focusable[focusable.length - 1]
        const currentFocus = document.activeElement

        if (e.shiftKey && currentFocus === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && currentFocus === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }

    // Auto-focus no primeiro elemento focável
    setTimeout(() => {
      const focusable = getFocusableElements()
      if (focusable.length > 0) focusable[0].focus()
    }, 0)

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Restaura foco ao elemento que estava ativo antes do modal abrir
      previousFocusRef.current?.focus()
    }
  }, [isOpen, onClose, onSubmit, getFocusableElements])

  return { modalRef }
}
