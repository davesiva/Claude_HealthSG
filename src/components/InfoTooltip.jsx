import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'

export default function InfoTooltip({ content, size = 14 }) {
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState(null) // { top, left, align }
  const tooltipRef = useRef(null)
  const buttonRef = useRef(null)

  const updateCoords = useCallback(() => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const tooltipWidth = 256
    const halfTooltip = tooltipWidth / 2
    const viewportWidth = window.innerWidth
    const padding = 12

    // Vertical: place above the button
    const top = rect.top - 8 // 8px gap above

    // Horizontal alignment
    let left, align
    const btnCenterX = rect.left + rect.width / 2

    if (btnCenterX - halfTooltip < padding) {
      // Too close to left edge — align left
      left = rect.left
      align = 'left'
    } else if (btnCenterX + halfTooltip > viewportWidth - padding) {
      // Too close to right edge — align right
      left = rect.right - tooltipWidth
      align = 'right'
    } else {
      // Center on button
      left = btnCenterX - halfTooltip
      align = 'center'
    }

    setCoords({ top, left, align })
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        tooltipRef.current && !tooltipRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      updateCoords()
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen, updateCoords])

  // Arrow offset relative to tooltip left edge
  const arrowStyle = coords ? (() => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return {}
    const btnCenterX = rect.left + rect.width / 2
    const arrowLeft = btnCenterX - coords.left
    return { left: `${arrowLeft}px`, transform: 'translateX(-50%)' }
  })() : {}

  return (
    <span className="relative inline-flex items-center">
      <button
        ref={buttonRef}
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
        onMouseEnter={() => { updateCoords(); setIsOpen(true) }}
        onMouseLeave={() => setIsOpen(false)}
        className="inline-flex items-center justify-center text-secondary/50 hover:text-accent transition-colors cursor-pointer ml-1"
        aria-label="More info"
      >
        <Info size={size} />
      </button>
      {isOpen && coords && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-[9999] w-64 max-w-[calc(100vw-24px)] px-3 py-2.5 rounded-xl bg-primary text-white text-xs leading-relaxed shadow-lg"
          style={{
            top: coords.top,
            left: coords.left,
            transform: 'translateY(-100%)',
            pointerEvents: 'auto',
          }}
        >
          {content}
          <div
            className="absolute top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-primary"
            style={arrowStyle}
          />
        </div>,
        document.body
      )}
    </span>
  )
}
