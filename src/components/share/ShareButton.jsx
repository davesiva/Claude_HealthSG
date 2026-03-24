import { useState, useRef, useCallback } from 'react'
import { Share2 } from 'lucide-react'
import ShareCardModal from './ShareCardModal'
import ShareCardRenderer from './ShareCardRenderer'
import { useShareCard } from './useShareCard'

export default function ShareButton({ title, subtitle, children, className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const cardRef = useRef(null)
  const { captureCard, downloadCard, copyToClipboard, nativeShare, imageDataUrl, isCapturing, reset } = useShareCard()

  const handleOpen = useCallback(async () => {
    setIsOpen(true)
    // Small delay to let the off-screen card render
    await new Promise(r => setTimeout(r, 100))
    if (cardRef.current) {
      await captureCard(cardRef.current)
    }
  }, [captureCard])

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

      {/* Off-screen card renderer */}
      <ShareCardRenderer ref={cardRef} title={title} subtitle={subtitle}>
        {children}
      </ShareCardRenderer>

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
