/**
 * Unified scroll utility for message lists
 * Handles both desktop and mobile scenarios with booking cards
 */

export interface ScrollOptions {
  retries?: number
  delay?: number
  behavior?: 'auto' | 'smooth'
}

export const scrollToBottom = (
  container: HTMLElement,
  options: ScrollOptions = {}
) => {
  const {
    retries = 1,
    delay = 100,
    behavior = 'auto'
  } = options

  if (!container) return

  // Check for mobile context and booking cards
  const isMobile = container.closest('.messages-page.mobile.conversation') !== null
  const lastChild = container.lastElementChild
  const hasBookingCard = lastChild?.querySelector('.booking-request-card') !== null

  // Primary scroll attempt
  performScroll(container, isMobile, hasBookingCard, behavior)

  // Retry mechanism if needed
  if (retries > 0) {
    setTimeout(() => {
      const currentScroll = container.scrollTop
      const maxScroll = container.scrollHeight - container.clientHeight

      // Only retry if we're not at the bottom (with small tolerance)
      if (Math.abs(currentScroll - maxScroll) > 10) {
        performScroll(container, isMobile, hasBookingCard, behavior)
      }
    }, delay)
  }
}

const performScroll = (
  container: HTMLElement,
  isMobile: boolean,
  hasBookingCard: boolean,
  behavior: 'auto' | 'smooth'
) => {
  const lastChild = container.lastElementChild

  if (isMobile) {
    if (hasBookingCard && lastChild) {
      // Mobile with booking card - use scrollIntoView for better reliability
      lastChild.scrollIntoView({ behavior, block: 'end', inline: 'nearest' })
    } else {
      // Mobile without booking card - smooth scroll or anchor
      const bottomAnchor = container.querySelector('#messages-bottom')
      if (bottomAnchor) {
        bottomAnchor.scrollIntoView({ behavior, block: 'start', inline: 'nearest' })
      } else if (lastChild) {
        lastChild.scrollIntoView({ behavior, block: 'end' })
      } else {
        container.scrollTop = container.scrollHeight
      }
    }
  } else {
    // Desktop - simple and reliable
    container.scrollTop = container.scrollHeight
  }
}

/**
 * Creates a unified scroll function with React timing optimization
 */
export const createScrollToBottom = (containerRef: React.RefObject<HTMLElement | null>) => {
  return (options: ScrollOptions = {}) => {
    if (!containerRef.current) return

    requestAnimationFrame(() => {
      setTimeout(() => {
        if (containerRef.current) {
          scrollToBottom(containerRef.current, options)
        }
      }, options.delay || 100)
    })
  }
}