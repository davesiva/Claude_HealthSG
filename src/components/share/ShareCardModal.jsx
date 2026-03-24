import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Copy, Share2, Check } from 'lucide-react'
import { useState } from 'react'

export default function ShareCardModal({ isOpen, onClose, imageDataUrl, isCapturing, onDownload, onCopy, onShare }) {
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  // Close on escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  async function handleCopy() {
    const ok = await onCopy()
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
            className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10 cursor-pointer"
            >
              <X size={20} className="text-secondary" />
            </button>

            {/* Preview */}
            <div className="p-6 pb-4">
              <h3 className="font-heading text-xl text-primary mb-4">Share Chart</h3>

              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-center min-h-[200px]">
                {isCapturing ? (
                  <div className="flex items-center gap-2 text-secondary text-sm">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    Generating image...
                  </div>
                ) : imageDataUrl ? (
                  <img
                    src={imageDataUrl}
                    alt="Chart card preview"
                    className="w-full rounded-lg shadow-sm"
                  />
                ) : (
                  <p className="text-secondary text-sm">Failed to generate image</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex flex-wrap gap-3">
              <button
                onClick={onDownload}
                disabled={!imageDataUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-full
                  font-semibold text-sm hover:bg-teal-600 transition-colors disabled:opacity-50
                  disabled:cursor-not-allowed cursor-pointer"
              >
                <Download size={16} />
                Download PNG
              </button>

              <button
                onClick={handleCopy}
                disabled={!imageDataUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-full
                  text-primary font-semibold text-sm hover:border-accent hover:text-accent
                  transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>

              {canShare && (
                <button
                  onClick={onShare}
                  disabled={!imageDataUrl}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-full
                    text-primary font-semibold text-sm hover:border-accent hover:text-accent
                    transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Share2 size={16} />
                  Share
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
