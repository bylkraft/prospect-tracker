import { describe, expect, it } from 'vitest'

import { resolveDrop } from '@/shared/board/hooks/use-board-dnd'

const BOARD = 'opportunities'
const card = (cardId: string, columnId: string) => ({ boardId: BOARD, cardId, columnId })
const column = (columnId: string) => ({ boardId: BOARD, columnId })

describe('resolveDrop', () => {
  it('moves a card dropped on another column', () => {
    expect(resolveDrop(BOARD, card('opp-1', 'stage-a'), column('stage-b'))).toEqual({
      cardId: 'opp-1',
      toColumnId: 'stage-b'
    })
  })

  it('resolves a drop onto another card, landing in that column', () => {
    expect(resolveDrop(BOARD, card('opp-1', 'stage-a'), card('opp-2', 'stage-b'))).toEqual({
      cardId: 'opp-1',
      toColumnId: 'stage-b'
    })
  })

  // Order inside a column is not persisted, so this would be a write with nothing to show.
  it('ignores a drop back into the same column', () => {
    expect(resolveDrop(BOARD, card('opp-1', 'stage-a'), column('stage-a'))).toBeNull()
    expect(resolveDrop(BOARD, card('opp-1', 'stage-a'), card('opp-2', 'stage-a'))).toBeNull()
  })

  it('ignores a drop that landed on nothing', () => {
    expect(resolveDrop(BOARD, card('opp-1', 'stage-a'), undefined)).toBeNull()
  })

  // The board id namespaces the drag, so another board's row cannot land here.
  it('ignores a source or target from another board', () => {
    expect(
      resolveDrop(BOARD, { boardId: 'other', cardId: 'x', columnId: 'y' }, column('s'))
    ).toBeNull()
    expect(
      resolveDrop(BOARD, card('opp-1', 'stage-a'), { boardId: 'other', columnId: 'stage-b' })
    ).toBeNull()
  })

  it('ignores a malformed payload rather than moving the wrong card', () => {
    expect(resolveDrop(BOARD, { boardId: BOARD, cardId: 1 }, column('stage-b'))).toBeNull()
  })
})
