import { useRef, useCallback, useEffect } from 'react'

interface Point {
  x: number
  y: number
}

interface Transform {
  scale: number
  translateX: number
  translateY: number
}

interface UsePinchZoomOptions {
  maxScale?: number
  minScale?: number
  onGestureEnd?: () => void
}

export function usePinchZoom(options: UsePinchZoomOptions = {}) {
  const { maxScale = 3, minScale = 1, onGestureEnd } = options
  const elementRef = useRef<HTMLImageElement>(null)
  const transformRef = useRef<Transform>({ scale: 1, translateX: 0, translateY: 0 })
  const initialDistanceRef = useRef<number>(0)
  const initialScaleRef = useRef<number>(1)
  const initialCenterRef = useRef<Point>({ x: 0, y: 0 })
  const isGestureActiveRef = useRef<boolean>(false)

  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  const getCenter = useCallback((touch1: Touch, touch2: Touch): Point => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    }
  }, [])

  const applyTransform = useCallback(() => {
    if (!elementRef.current) return

    const { scale, translateX, translateY } = transformRef.current
    elementRef.current.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`
  }, [])

  const resetTransform = useCallback(() => {
    if (!elementRef.current) return

    transformRef.current = { scale: 1, translateX: 0, translateY: 0 }
    elementRef.current.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    applyTransform()

    setTimeout(() => {
      if (elementRef.current) {
        elementRef.current.style.transition = ''
      }
    }, 300)
  }, [applyTransform])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 2) return

    e.preventDefault()
    isGestureActiveRef.current = true

    const touch1 = e.touches[0]
    const touch2 = e.touches[1]

    initialDistanceRef.current = getDistance(touch1, touch2)
    initialScaleRef.current = transformRef.current.scale
    initialCenterRef.current = getCenter(touch1, touch2)
  }, [getDistance, getCenter])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 2 || !isGestureActiveRef.current) return

    e.preventDefault()

    const touch1 = e.touches[0]
    const touch2 = e.touches[1]

    const currentDistance = getDistance(touch1, touch2)
    const currentCenter = getCenter(touch1, touch2)

    const scaleChange = currentDistance / initialDistanceRef.current
    let newScale = initialScaleRef.current * scaleChange

    newScale = Math.max(minScale, Math.min(maxScale, newScale))

    const deltaX = currentCenter.x - initialCenterRef.current.x
    const deltaY = currentCenter.y - initialCenterRef.current.y

    transformRef.current = {
      scale: newScale,
      translateX: deltaX / newScale,
      translateY: deltaY / newScale
    }

    applyTransform()
  }, [getDistance, getCenter, minScale, maxScale, applyTransform])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    // Reset when no more touches are on screen
    if (e.touches.length === 0) {
      isGestureActiveRef.current = false
      resetTransform()
      onGestureEnd?.()
    }
    // Also reset if we go from 2 touches to 1 touch (gesture ended)
    else if (e.touches.length === 1 && isGestureActiveRef.current) {
      isGestureActiveRef.current = false
      resetTransform()
      onGestureEnd?.()
    }
  }, [resetTransform, onGestureEnd])

  const handleTouchCancel = useCallback(() => {
    // Reset on touch cancel (system interruption)
    isGestureActiveRef.current = false
    resetTransform()
    onGestureEnd?.()
  }, [resetTransform, onGestureEnd])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })
    element.addEventListener('touchcancel', handleTouchCancel, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchCancel)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel])

  return {
    ref: elementRef,
    reset: resetTransform
  }
}