// How cards move when one changes column — see docs/reference/board-mechanism.md
export type Point = { x: number; y: number }
type Input = { clientX: number; clientY: number }
type Scroll = { scroller: HTMLElement; from: number; to: number }

// A card in the air — the drag preview, then the dropped card until it lands — looks the same, so
// the handover from one to the other is invisible.
const LIFTED_TILT = 'rotate(2deg)'
const LIFTED_SHADOW = '0 12px 24px -8px rgb(0 0 0 / 0.22)'

// Soft at the end without a long tail, which reads as the card hovering over its slot.
const GLIDE_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)'
const SETTLE_EASING = 'ease-in-out'
// The glide carries the card; the settle only finishes it, so it follows on quickly.
const GLIDE_DURATION = { dropped: 340, moved: 300 }
const SETTLE_DURATION = 180
// The column comes to the card first, so the glide always ends in view.
const REVEAL_DURATION = 300
const REVEAL_MARGIN = 8
// Neighbours make room on react-beautiful-dnd's curve.
const SHIFT_EASING = 'cubic-bezier(0.2, 0, 0, 1)'
const SHIFT_DURATION = 350

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function easeInOut(progress: number) {
  return progress < 0.5 ? 2 * progress ** 2 : 1 - (-2 * progress + 2) ** 2 / 2
}

export function lift(element: HTMLElement) {
  element.style.transform = LIFTED_TILT
  element.style.boxShadow = LIFTED_SHADOW
}

// Where the pointer holds the card, so the drop can tell where the preview was drawn.
export function grabOffset(input: Input, element: Element): Point {
  const rect = element.getBoundingClientRect()
  return { x: input.clientX - rect.x, y: input.clientY - rect.y }
}

export function droppedAt(data: Record<string, unknown>, input: Input): Point | null {
  const grab = data.grab
  if (typeof grab !== 'object' || grab === null || !('x' in grab) || !('y' in grab)) return null
  if (typeof grab.x !== 'number' || typeof grab.y !== 'number') return null

  return { x: input.clientX - grab.x, y: input.clientY - grab.y }
}

function scrollParent(element: HTMLElement) {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node)
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node
    }
  }
  return null
}

// The scroll that brings the card into its column's view, or null when it is already there.
function revealScroll(element: HTMLElement): Scroll | null {
  const scroller = scrollParent(element)
  if (!scroller) return null

  const view = scroller.getBoundingClientRect()
  const rect = element.getBoundingClientRect()
  if (rect.top >= view.top && rect.bottom <= view.bottom) return null

  const from = scroller.scrollTop
  return { scroller, from, to: Math.max(0, from + rect.top - view.top - REVEAL_MARGIN) }
}

// `onFrame` gets how far the content has moved, so a held card can stay put while it scrolls.
function playScroll({ scroller, from, to }: Scroll, onFrame: (moved: number) => void) {
  return new Promise<void>((resolve) => {
    const began = performance.now()
    const step = (now: number) => {
      const progress = Math.min(1, (now - began) / REVEAL_DURATION)
      scroller.scrollTop = from + (to - from) * easeInOut(progress)
      onFrame(from - scroller.scrollTop)

      if (progress < 1) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
}

// From where the preview was released when dragged; from just below its slot when moved by menu.
// Call before paint: until the glide starts, the card is held off its slot.
export function animateArrival(element: HTMLElement, from: Point | null) {
  // Measured before the hold moves the card, or it would always look in view.
  const scroll = revealScroll(element)

  if (prefersReducedMotion()) {
    if (scroll) scroll.scroller.scrollTop = scroll.to
    return
  }

  const slot = element.getBoundingClientRect()
  const hold = (moved: number) => {
    if (from) {
      const offset = `translate(${from.x - slot.x}px, ${from.y - slot.y - moved}px)`
      element.style.transform = `${offset} ${LIFTED_TILT}`
      element.style.boxShadow = LIFTED_SHADOW
    } else {
      element.style.opacity = '0'
    }
  }

  // Above its new neighbours while it travels over them.
  element.style.zIndex = '10'
  hold(0)

  void (scroll ? playScroll(scroll, hold) : Promise.resolve()).then(() => {
    for (const property of ['transform', 'box-shadow', 'opacity']) {
      element.style.removeProperty(property)
    }
    glide(element, from)
  })
}

function glide(element: HTMLElement, from: Point | null) {
  const rect = element.getBoundingClientRect()
  const start: Keyframe = from
    ? {
        transform: `translate(${from.x - rect.x}px, ${from.y - rect.y}px) ${LIFTED_TILT}`,
        boxShadow: LIFTED_SHADOW,
        easing: GLIDE_EASING
      }
    : { opacity: 0, transform: 'translateY(8px) scale(0.96)', easing: GLIDE_EASING }

  const glideDuration = from ? GLIDE_DURATION.dropped : GLIDE_DURATION.moved
  const duration = glideDuration + SETTLE_DURATION
  const release = () => element.style.removeProperty('z-index')

  const animation = element.animate(
    [
      start,
      {
        offset: glideDuration / duration,
        opacity: 1,
        transform: 'translateY(-3px) rotate(-0.4deg) scale(1.015)',
        boxShadow: LIFTED_SHADOW,
        easing: SETTLE_EASING
      },
      {
        offset: (glideDuration + SETTLE_DURATION / 2) / duration,
        transform: 'translateY(1px) scale(0.997)',
        easing: SETTLE_EASING
      },
      { transform: 'none' }
    ],
    { duration }
  )
  // A cancelled animation rejects; the card goes back under its neighbours either way.
  void animation.finished.then(release, release)
}

// A card whose place in its column changed glides from the old one instead of jumping.
export function animateShift(element: HTMLElement, fromTop: number) {
  const delta = fromTop - element.offsetTop
  if (delta === 0 || prefersReducedMotion()) return

  element.animate([{ transform: `translateY(${delta}px)` }, { transform: 'none' }], {
    duration: SHIFT_DURATION,
    easing: SHIFT_EASING
  })
}
