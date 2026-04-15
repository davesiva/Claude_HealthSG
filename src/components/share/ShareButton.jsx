import { useState, useRef, useCallback } from 'react'
import { Share2 } from 'lucide-react'
import { toPng } from 'html-to-image'
import ShareCardModal from './ShareCardModal'
import { useShareCard } from './useShareCard'

export default function ShareButton({ title, subtitle, chartRef, className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const { downloadCard, copyToClipboard, nativeShare, imageDataUrl, isCapturing, reset, setImageDataUrl, setIsCapturing } = useShareCard()

  const handleOpen = useCallback(async () => {
    setIsOpen(true)
    setIsCapturing(true)

    try {
      await document.fonts.ready

      // Find the chart element: use chartRef if provided, otherwise find nearest .recharts-wrapper
      let chartEl = chartRef?.current
      if (!chartEl) {
        // Walk up from the button to find the card container, then find the chart inside
        return
      }

      // Capture the chart first
      const chartDataUrl = await toPng(chartEl, {
        pixelRatio: 2,
        backgroundColor: '#FFFFFF',
        fontEmbedCSS: '',
      })

      // Now build the branded card using canvas
      const canvas = document.createElement('canvas')
      canvas.width = 2400  // 1200 * 2 for retina
      canvas.height = 1260 // 630 * 2
      const ctx = canvas.getContext('2d')

      // Background
      ctx.fillStyle = '#FAFAF8'
      ctx.fillRect(0, 0, 2400, 1260)

      // Top accent bar
      const grad = ctx.createLinearGradient(0, 0, 2400, 0)
      grad.addColorStop(0, '#5370E0')
      grad.addColorStop(1, '#14B8A6')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 2400, 10)

      // Header: "Middle Out"
      ctx.fillStyle = '#1A1A1A'
      ctx.font = '44px "Lato", sans-serif'
      ctx.fillText('Middle Out', 96, 80)

      // Subheader
      ctx.fillStyle = '#9CA3AF'
      ctx.font = '26px "Roboto Mono", monospace'
      ctx.fillText('Singapore Health Data', 350, 80)

      // Title
      ctx.fillStyle = '#1A1A1A'
      ctx.font = '600 52px "Lato", sans-serif'
      ctx.fillText(title || '', 96, 140)

      // Subtitle
      if (subtitle) {
        ctx.fillStyle = '#6B7280'
        ctx.font = '28px "Lato", sans-serif'
        ctx.fillText(subtitle, 96, 178)
      }

      // Chart image
      const chartImg = new Image()
      await new Promise((resolve, reject) => {
        chartImg.onload = resolve
        chartImg.onerror = reject
        chartImg.src = chartDataUrl
      })

      // Draw chart centered, fitting within the card
      const chartArea = { x: 96, y: 210, w: 2208, h: 880 }
      const scale = Math.min(chartArea.w / chartImg.width, chartArea.h / chartImg.height)
      const drawW = chartImg.width * scale
      const drawH = chartImg.height * scale
      const drawX = chartArea.x + (chartArea.w - drawW) / 2
      const drawY = chartArea.y + (chartArea.h - drawH) / 2
      ctx.drawImage(chartImg, drawX, drawY, drawW, drawH)

      // Footer divider
      ctx.strokeStyle = '#E5E7EB'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(96, 1180)
      ctx.lineTo(2304, 1180)
      ctx.stroke()

      // Footer text
      ctx.fillStyle = '#9CA3AF'
      ctx.font = '24px "Roboto Mono", monospace'
      ctx.fillText('Middle Out', 96, 1220)

      ctx.fillStyle = '#D1D5DB'
      ctx.font = '22px "Roboto Mono", monospace'
      ctx.textAlign = 'right'
      ctx.fillText('Data: SingStat, MOH, OWID', 2304, 1220)
      ctx.textAlign = 'left'

      const dataUrl = canvas.toDataURL('image/png')
      setImageDataUrl(dataUrl)
    } catch (err) {
      console.error('Failed to capture chart card:', err)
    } finally {
      setIsCapturing(false)
    }
  }, [chartRef, title, subtitle, setImageDataUrl, setIsCapturing])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    reset()
  }, [reset])

  return (
    <>
      <button
        onClick={handleOpen}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
          text-xs font-semibold text-secondary border border-border
          hover:border-accent hover:text-accent transition-colors duration-200
          cursor-pointer ${className}`}
        title="Share this chart"
      >
        <Share2 size={13} />
        Share
      </button>

      {/* Modal */}
      <ShareCardModal
        isOpen={isOpen}
        onClose={handleClose}
        imageDataUrl={imageDataUrl}
        isCapturing={isCapturing}
        onDownload={() => downloadCard(imageDataUrl)}
        onCopy={() => copyToClipboard(imageDataUrl)}
        onShare={() => nativeShare(imageDataUrl, title)}
      />
    </>
  )
}
