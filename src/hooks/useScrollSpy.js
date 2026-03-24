import { useState, useEffect, useRef } from 'react'

export default function useScrollSpy(sections, rootMargin = '-20% 0px -60% 0px') {
  const [activeIndex, setActiveIndex] = useState(0)
  const observerRefs = useRef([])

  useEffect(() => {
    if (!sections?.length) return

    const observers = []
    const visibleSections = new Set()

    sections.forEach((section, index) => {
      const el = section.ref?.current
      if (!el) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            visibleSections.add(index)
          } else {
            visibleSections.delete(index)
          }
          if (visibleSections.size > 0) {
            setActiveIndex(Math.min(...visibleSections))
          }
        },
        { rootMargin, threshold: 0 }
      )

      observer.observe(el)
      observers.push(observer)
      observerRefs.current[index] = observer
    })

    return () => {
      observers.forEach(obs => obs.disconnect())
    }
  }, [sections, rootMargin])

  return activeIndex
}
