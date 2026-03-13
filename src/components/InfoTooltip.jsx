import { useState, useRef, useEffect, useCallback } from 'react'
import { Info } from 'lucide-react'

export default function InfoTooltip({ content, size = 14 }) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState('center') // 'center' | 'left' | 'right'
  const tooltipRef = useRef(null)
  const buttonRef = useRef(null)

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const tooltipWidth = 256 // w-64 = 16rem = 256px
    const halfTooltip = tooltipWidth / 2
    const viewportWidth = window.innerWidth
    const padding = 12

    if (rect.left - halfTooltip < padding) {
      setPosition('left')
    } else if (rect.right + halfTooltip > viewportWidth - padding) {
      setPosition('right')
    } else {
      setPosition('center')
    }
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
      updatePosition()
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen, updatePosition])

  const positionClasses = {
    center: 'left-1/2 -translate-x-1/2',
    left: 'left-0',
    right: 'right-0'
  }

  const arrowClasses = {
    center: 'left-1/2 -translate-x-1/2',
    left: 'left-3',
    right: 'right-3'
  }

  return (
    <span className="relative inline-flex items-center">
      <button
        ref={buttonRef}
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
        onMouseEnter={() => { updatePosition(); setIsOpen(true) }}
        onMouseLeave={() => setIsOpen(false)}
        className="inline-flex items-center justify-center text-secondary/50 hover:text-accent transition-colors cursor-pointer ml-1"
        aria-label="More info"
      >
        <Info size={size} />
      </button>
      {isOpen && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 bottom-full mb-2 w-64 max-w-[calc(100vw-24px)] px-3 py-2.5 rounded-xl bg-primary text-white text-xs leading-relaxed shadow-lg ${positionClasses[position]}`}
          style={{ pointerEvents: 'auto' }}
        >
          {content}
          <div className={`absolute top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-primary ${arrowClasses[position]}`} />
        </div>
      )}
    </span>
  )
}
