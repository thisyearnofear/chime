import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

export function formatDistance(miles: number): string {
  if (miles < 0.1) {
    return `${Math.round(miles * 5280)} ft`
  }
  return `${miles.toFixed(1)} mi`
}

export function generateShareUrl(asset = 'BTC', windowLabel = '15m'): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/?asset=${asset}&window=${windowLabel}`
  }
  return `/?asset=${asset}&window=${windowLabel}`
}

export function copyToClipboard(text: string): Promise<void> {
  // Only run on client side
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return Promise.resolve()
  }

  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text)
  }
  
  // Fallback for older browsers
  const textArea = document.createElement('textarea')
  textArea.value = text
  document.body.appendChild(textArea)
  textArea.select()
  document.execCommand('copy')
  document.body.removeChild(textArea)
  return Promise.resolve()
}