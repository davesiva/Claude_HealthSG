import { useState, useCallback } from 'react'
import { toPng } from 'html-to-image'

export function useShareCard() {
  const [imageDataUrl, setImageDataUrl] = useState(null)
  const [isCapturing, setIsCapturing] = useState(false)

  const captureCard = useCallback(async (element) => {
    if (!element) return null
    setIsCapturing(true)
    try {
      // Wait for fonts to load
      await document.fonts.ready
      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#FAFAF8',
        // Provide empty CSS to skip font embedding (avoids CORS errors with Google Fonts)
        fontEmbedCSS: '',
      })
      setImageDataUrl(dataUrl)
      return dataUrl
    } catch (err) {
      console.error('Failed to capture card:', err)
      return null
    } finally {
      setIsCapturing(false)
    }
  }, [])

  const downloadCard = useCallback((dataUrl, filename = 'middleout-chart.png') => {
    const url = dataUrl || imageDataUrl
    if (!url) return
    const link = document.createElement('a')
    link.download = filename
    link.href = url
    link.click()
  }, [imageDataUrl])

  const copyToClipboard = useCallback(async (dataUrl) => {
    const url = dataUrl || imageDataUrl
    if (!url) return false
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      return true
    } catch {
      return false
    }
  }, [imageDataUrl])

  const nativeShare = useCallback(async (dataUrl, title = 'Singapore Health Data') => {
    const url = dataUrl || imageDataUrl
    if (!url || !navigator.share) return false
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const file = new File([blob], 'middleout-chart.png', { type: 'image/png' })
      await navigator.share({ title, files: [file] })
      return true
    } catch {
      return false
    }
  }, [imageDataUrl])

  const reset = useCallback(() => {
    setImageDataUrl(null)
  }, [])

  return { captureCard, downloadCard, copyToClipboard, nativeShare, imageDataUrl, isCapturing, reset, setImageDataUrl, setIsCapturing }
}
