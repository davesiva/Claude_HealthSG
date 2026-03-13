import { useState, useRef, useEffect } from 'react'
import { Info } from 'lucide-react'

export default function InfoTooltip({ content, size = 14 }) {
  const [isOpen, setIsOpen] = useState(false)
  const tooltipRef = useRef(null)
  const buttonRef = useRef(null)

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
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  return (
    <span className="relative inline-flex items-center">
      <button
        ref={buttonRef}
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="inline-flex items-center justify-center text-secondary/50 hover:text-accent transition-colors cursor-pointer ml-1"
        aria-label="More info"
      >
        <Info size={size} />
      </button>
      {isOpen && (
        <div
          ref={tooltipRef}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2.5 rounded-xl bg-primary text-white text-xs leading-relaxed shadow-lg"
          style={{ pointerEvents: 'auto' }}
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-primary" />
        </div>
      )}
    </span>
  )
}
