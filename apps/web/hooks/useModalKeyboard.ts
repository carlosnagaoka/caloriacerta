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

  // Mantém as callbacks em refs — assim o effect não re-executa quando
  // as funções são recriadas pelo componente pai a cada render
  const onCloseRef = useRef(onClose)
  const onSubmitRef = useRef(onSubmit)
  onCloseRef.current = onClose
  onSubmitRef.current = onSubmit

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
        onCloseRef.current()
        return
      }

      // Enviar com Ctrl+Enter / Cmd+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        onSubmitRef.current?.()
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

    // Auto-focus no primeiro elemento focável (só na abertura do modal)
    setTimeout(() => {
      const focusable = getFocusableElements()
      if (focusable.length > 0) focusable[0].focus()
    }, 0)

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocusRef.current?.focus()
    }
  // onClose e onSubmit removidos das deps — usamos refs para acessá-los
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, getFocusableElements])

  return { modalRef }
}
