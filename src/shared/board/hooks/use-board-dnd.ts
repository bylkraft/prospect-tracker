import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  draggable,
  dropTargetForElements,
  monitorForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'

import {
  animateArrival,
  animateShift,
  droppedAt,
  grabOffset,
  lift,
  type Point
} from '@/shared/board/board-motion'

// Cross-column drag wiring — see docs/reference/board-mechanism.md
type CardData = { boardId: string; cardId: string; columnId: string }
type ColumnData = { boardId: string; columnId: string }

function isCardData(data: Record<string, unknown>, boardId: string): data is CardData {
  return (
    data.boardId === boardId && typeof data.cardId === 'string' && typeof data.columnId === 'string'
  )
}

function isColumnData(data: Record<string, unknown>, boardId: string): data is ColumnData {
  return data.boardId === boardId && typeof data.columnId === 'string' && !('cardId' in data)
}

// Pure, so the drop decision is testable — see docs/reference/board-mechanism.md
export function resolveDrop(
  boardId: string,
  sourceData: Record<string, unknown>,
  targetData: Record<string, unknown> | undefined
): { cardId: string; toColumnId: string } | null {
  if (!isCardData(sourceData, boardId) || !targetData) return null

  const toColumnId = isCardData(targetData, boardId)
    ? targetData.columnId
    : isColumnData(targetData, boardId)
      ? targetData.columnId
      : null

  // A drop back into the same column is not a move: order is not persisted.
  if (toColumnId === null || toColumnId === sourceData.columnId) return null

  return { cardId: sourceData.cardId, toColumnId }
}

type Options = {
  boardId: string
  onMove: (cardId: string, toColumnId: string) => void
}

// Edge scrolling during a drag — see docs/reference/board-mechanism.md
function autoScroll(element: Element, boardId: string, axis: 'horizontal' | 'vertical') {
  return autoScrollForElements({
    element,
    canScroll: ({ source }) => isCardData(source.data, boardId),
    getAllowedAxis: () => axis
  })
}

// boardId -> the card about to remount. A move remounts the card in its new column; these hand what
// the old one was doing to the new one. See docs/reference/board-mechanism.md
const pendingFocus = new Map<string, string>()
const pendingArrival = new Map<string, { cardId: string; from: Point | null }>()
// A card the move filters off the board never mounts to claim its entry; it must not fire later.
const PENDING_TTL = 1000

function expectRemount<T>(pending: Map<string, T>, boardId: string, entry: T) {
  pending.set(boardId, entry)
  setTimeout(() => {
    if (pending.get(boardId) === entry) pending.delete(boardId)
  }, PENDING_TTL)
}

export function useBoardDnd({ boardId, onMove }: Options) {
  const latest = useRef(onMove)
  latest.current = onMove
  // State, not a ref: the row mounts only once the board has cards, after this hook first runs.
  const [row, rowRef] = useState<HTMLDivElement | null>(null)

  useEffect(
    () =>
      monitorForElements({
        canMonitor: ({ source }) => isCardData(source.data, boardId),
        onDrop: ({ source, location }) => {
          // Innermost first: a card dropped over another card resolves to that card's column.
          const move = resolveDrop(boardId, source.data, location.current.dropTargets[0]?.data)

          if (!move) return

          const from = droppedAt(source.data, location.current.input)
          expectRemount(pendingArrival, boardId, { cardId: move.cardId, from })
          latest.current(move.cardId, move.toColumnId)
        }
      }),
    [boardId]
  )

  useEffect(() => {
    if (!row) return

    return autoScroll(row, boardId, 'horizontal')
  }, [row, boardId])

  return { rowRef }
}

// Room for the tilted preview's corners, which the native snapshot would otherwise crop.
const PREVIEW_GUTTER = 8

// A drag that starts on a control is that control's, not the card's: pressing the pin or opening
// the menu must not pick the card up. See docs/reference/board-mechanism.md
const INTERACTIVE = 'button, a, input, select, textarea, [role="button"], [role="menuitem"]'

export function useBoardCard(
  boardId: string,
  cardId: string,
  columnId: string,
  acceptsDrops = true
) {
  const ref = useRef<HTMLDivElement>(null)
  // What the keyboard reaches the card through, when the card itself is not focusable.
  const focusRef = useRef<HTMLButtonElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const lastTop = useRef<number | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const data = { boardId, cardId, columnId }

    return combine(
      draggable({
        element,
        // The whole card is the handle — it carries no inputs, so there is nothing to hit-test
        // around except its own controls, which this excludes.
        canDrag: ({ input }) => {
          const target = document.elementFromPoint(input.clientX, input.clientY)
          const control = target?.closest(INTERACTIVE)

          // A card that is itself a `role="button"` would match from anywhere inside and block every
          // drag. Only a control *below* the card counts.
          return !control || control === element
        },
        getInitialData: ({ input }) => ({ ...data, grab: grabOffset(input, element) }),
        // The card itself, held where it was grabbed — see docs/reference/board-mechanism.md
        onGenerateDragPreview: ({ nativeSetDragImage, location }) => {
          const grab = grabOffset(location.current.input, element)

          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: () => ({ x: grab.x + PREVIEW_GUTTER, y: grab.y + PREVIEW_GUTTER }),
            render: ({ container }) => {
              const clone = element.cloneNode(true)
              if (!(clone instanceof HTMLElement)) return

              clone.style.width = `${element.offsetWidth}px`
              lift(clone)
              container.style.padding = `${PREVIEW_GUTTER}px`
              container.appendChild(clone)
            }
          })
        },
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false)
      }),
      // A card is a drop target too, so dropping onto the cards rather than the gap below them
      // still lands in that column.
      dropTargetForElements({
        element,
        canDrop: ({ source }) => acceptsDrops && isCardData(source.data, boardId),
        getDropEffect: () => 'move',
        getData: () => data
      })
    )
  }, [boardId, cardId, columnId, acceptsDrops])

  useEffect(() => {
    if (pendingFocus.get(boardId) !== cardId) return

    pendingFocus.delete(boardId)
    const target = focusRef.current ?? ref.current
    // The arrival brings the card into view; a focus scroll would jump ahead of it.
    target?.focus({ preventScroll: true })
  }, [boardId, cardId])

  // Before paint, so the card never shows in its slot before flying into it.
  useLayoutEffect(() => {
    const arrival = pendingArrival.get(boardId)
    if (arrival?.cardId !== cardId || !ref.current) return

    pendingArrival.delete(boardId)
    animateArrival(ref.current, arrival.from)
  }, [boardId, cardId])

  // Every render, no deps: a move elsewhere in the column re-renders this card without changing it.
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    if (lastTop.current !== null) animateShift(element, lastTop.current)
    lastTop.current = element.offsetTop
  })

  // A menu move keeps the focus on the card and lands like a dropped one.
  const beforeMenuMove = () => {
    expectRemount(pendingFocus, boardId, cardId)
    expectRemount(pendingArrival, boardId, { cardId, from: null })
  }

  return { ref, focusRef, isDragging, beforeMenuMove }
}

export function useBoardColumn(boardId: string, columnId: string, acceptsDrops = true) {
  const ref = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [isOver, setIsOver] = useState(false)

  useEffect(() => {
    const element = scrollerRef.current
    if (!element) return

    return autoScroll(element, boardId, 'vertical')
  }, [boardId])

  useEffect(() => {
    const element = ref.current
    if (!element) return

    return dropTargetForElements({
      element,
      canDrop: ({ source }) =>
        acceptsDrops && isCardData(source.data, boardId) && source.data.columnId !== columnId,
      getDropEffect: () => 'move',
      getData: () => ({ boardId, columnId }),
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: () => setIsOver(false)
    })
  }, [boardId, columnId, acceptsDrops])

  return { ref, scrollerRef, isOver }
}
