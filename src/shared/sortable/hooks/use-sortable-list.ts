import { useEffect, useRef, useState } from 'react'

import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  draggable,
  dropTargetForElements,
  monitorForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge'

// Drag wiring for the three reorderable lists — see docs/reference/sortable-mechanism.md
type ItemData = { listId: string; id: string; index: number }

function isItemData(data: Record<string, unknown>, listId: string): data is ItemData {
  return data.listId === listId && typeof data.id === 'string' && typeof data.index === 'number'
}

type Options = {
  listId: string
  ids: string[]
  onReorder: (ids: string[], movedId: string) => void
}

export function useSortableList({ listId, ids, onReorder }: Options) {
  const latest = useRef({ ids, onReorder })
  latest.current = { ids, onReorder }

  useEffect(
    () =>
      monitorForElements({
        canMonitor: ({ source }) => isItemData(source.data, listId),
        onDrop: ({ source, location }) => {
          const target = location.current.dropTargets[0]
          if (!target || !isItemData(source.data, listId) || !isItemData(target.data, listId))
            return

          const { ids, onReorder } = latest.current
          const startIndex = ids.indexOf(source.data.id)
          const indexOfTarget = ids.indexOf(target.data.id)
          if (startIndex < 0 || indexOfTarget < 0) return

          const next = reorderWithEdge({
            list: ids,
            startIndex,
            indexOfTarget,
            closestEdgeOfTarget: extractClosestEdge(target.data),
            axis: 'vertical'
          })

          if (next.some((id, index) => id !== ids[index])) onReorder(next, source.data.id)
        }
      }),
    [listId]
  )
}

type ItemState = {
  isDragging: boolean
  closestEdge: Edge | null
}

export function useSortableItem(listId: string, id: string, index: number) {
  const ref = useRef<HTMLDivElement>(null)
  // State, not a ref: a grip mounted later must still register.
  const [handle, setHandle] = useState<HTMLButtonElement | null>(null)
  const [state, setState] = useState<ItemState>({ isDragging: false, closestEdge: null })

  const indexRef = useRef(index)
  indexRef.current = index

  useEffect(() => {
    const element = ref.current
    if (!element || !handle) return

    const data = () => ({ listId, id, index: indexRef.current })

    return combine(
      draggable({
        element,
        dragHandle: handle,
        getInitialData: data,
        onGenerateDragPreview: ({ nativeSetDragImage, source }) => {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: pointerOutsideOfPreview({ x: '12px', y: '8px' }),
            render: ({ container }) => {
              const chip = document.createElement('div')
              chip.textContent = source.element.querySelector('input')?.value ?? ''
              chip.className =
                'bg-card text-foreground border-border rounded-lg border px-3 py-1.5 ' +
                'text-sm font-medium shadow-md'
              container.appendChild(chip)
            }
          })
        },
        onDragStart: () => setState({ isDragging: true, closestEdge: null }),
        onDrop: () => setState({ isDragging: false, closestEdge: null })
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => source.element !== element && isItemData(source.data, listId),
        getDropEffect: () => 'move',
        getData: ({ input }) =>
          attachClosestEdge(data(), { input, element, allowedEdges: ['top', 'bottom'] }),
        onDrag: ({ self, source }) => {
          const closestEdge = extractClosestEdge(self.data)
          const from = isItemData(source.data, listId) ? source.data.index : null
          const index = indexRef.current

          const isNoop =
            from !== null &&
            ((index === from - 1 && closestEdge === 'bottom') ||
              (index === from + 1 && closestEdge === 'top'))

          const next = isNoop ? null : closestEdge

          setState((current) =>
            current.closestEdge === next ? current : { ...current, closestEdge: next }
          )
        },
        onDragLeave: () => setState((current) => ({ ...current, closestEdge: null })),
        onDrop: () => setState((current) => ({ ...current, closestEdge: null }))
      })
    )
  }, [listId, id, handle])

  return { ref, handleRef: setHandle, ...state }
}
