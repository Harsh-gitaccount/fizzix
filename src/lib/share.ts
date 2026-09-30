import { showToast } from '@/components/ui/Toast'
import { playSound } from '@/lib/sound/engine'

export function captureScreenshot(canvas: HTMLCanvasElement | null, soundEnabled: boolean) {
  if (!canvas) return
  if (soundEnabled) playSound('screenshot')

  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fizzix-${Date.now()}.png`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Screenshot saved', '✓')
  }, 'image/png')
}

export function buildShareURL(params: Record<string, number>, tab: string): string {
  const url = new URL(window.location.origin + window.location.pathname)
  url.searchParams.set('tab', tab)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v))
  }
  const result = url.toString()
  if (result.length > 2000) {
    showToast('URL too long to share', '!')
    return ''
  }
  return result
}

export async function copyShareURL(params: Record<string, number>, tab: string) {
  const url = buildShareURL(params, tab)
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    showToast('Link copied to clipboard', '✓')
  } catch {
    showToast('Could not copy link')
  }
}
