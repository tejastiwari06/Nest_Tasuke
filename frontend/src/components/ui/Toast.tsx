import React, { useEffect, useState } from 'react'
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

let listeners: ((toasts: Toast[]) => void)[] = []
let toasts: Toast[] = []

function emit() {
  listeners.forEach(fn => fn([...toasts]))
}

export const toast = {
  success: (message: string) => addToast('success', message),
  error: (message: string) => addToast('error', message),
  warning: (message: string) => addToast('warning', message),
  info: (message: string) => addToast('info', message),
}

function addToast(type: ToastType, message: string) {
  const id = Math.random().toString(36).slice(2)
  toasts = [...toasts, { id, type, message }]
  emit()
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id)
    emit()
  }, 4500)
}

export function ToastContainer() {
  const [items, setItems] = useState<Toast[]>([])

  useEffect(() => {
    listeners.push(setItems)
    return () => { listeners = listeners.filter(fn => fn !== setItems) }
  }, [])

  const icons = {
    success: <CheckCircle size={16} className="text-success shrink-0" />,
    error: <XCircle size={16} className="text-threat shrink-0" />,
    warning: <AlertTriangle size={16} className="text-warning shrink-0" />,
    info: <Info size={16} className="text-violet-lavender shrink-0" />,
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {items.map(t => (
        <div
          key={t.id}
          className="glass-elevated rounded-lg px-4 py-3 flex items-center gap-3 max-w-sm text-sm text-text-main pointer-events-auto animate-fade-in shadow-xl"
        >
          {icons[t.type]}
          <span>{t.message}</span>
          <button
            onClick={() => { toasts = toasts.filter(x => x.id !== t.id); emit() }}
            className="ml-auto text-text-secondary hover:text-text-main"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
