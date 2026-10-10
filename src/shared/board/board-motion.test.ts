import { describe, expect, it } from 'vitest'

import { droppedAt } from '@/shared/board/board-motion'

const input = { clientX: 300, clientY: 200 }

describe('droppedAt', () => {
  it('places the preview where the pointer held the card', () => {
    expect(droppedAt({ grab: { x: 40, y: 15 } }, input)).toEqual({ x: 260, y: 185 })
  })

  // The payload crosses the drag as `unknown`; a bad one lands like a menu move instead of throwing.
  it('returns null for a missing or malformed grab', () => {
    expect(droppedAt({}, input)).toBeNull()
    expect(droppedAt({ grab: null }, input)).toBeNull()
    expect(droppedAt({ grab: { x: '40', y: 15 } }, input)).toBeNull()
  })
})
