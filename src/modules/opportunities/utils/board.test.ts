import { describe, expect, it } from 'vitest'

import { isTerminalStage, toColumns, withPatchedRow } from '@/modules/opportunities/utils/board'
import { makeRow, makeStage } from '@/modules/opportunities/utils/opportunity-fixture'

const contacted = makeStage({ id: 'stage-a', name: 'Contacté', position: 0 })
const interview = makeStage({ id: 'stage-b', name: 'Entretien', position: 1 })
const parked = makeStage({ id: 'stage-c', name: 'Rangé', position: 2, isArchived: true })

describe('toColumns', () => {
  it('gives every active stage a column, in pipeline order', () => {
    const columns = toColumns([], [contacted, interview])

    expect(columns.map((column) => column.stage.id)).toEqual(['stage-a', 'stage-b'])
  })

  it('keeps an empty column rather than dropping it', () => {
    const columns = toColumns([makeRow({ stageId: 'stage-a' })], [contacted, interview])

    expect(columns[1]?.cards).toEqual([])
  })

  it('leaves empty archived stages out of the board', () => {
    const columns = toColumns([], [contacted, parked])

    expect(columns.map((column) => column.stage.id)).toEqual(['stage-a'])
  })

  // The archived tab returns rows from archived stages; without a column they would vanish.
  it('keeps an archived stage that still holds cards', () => {
    const columns = toColumns([makeRow({ stageId: 'stage-c' })], [contacted, parked])

    expect(columns.map((column) => column.stage.id)).toEqual(['stage-a', 'stage-c'])
    expect(columns[1]?.cards).toHaveLength(1)
  })

  it('groups each row under its own stage', () => {
    const columns = toColumns(
      [
        makeRow({ id: 'opp-1', stageId: 'stage-b' }),
        makeRow({ id: 'opp-2', stageId: 'stage-a' }),
        makeRow({ id: 'opp-3', stageId: 'stage-b' })
      ],
      [contacted, interview]
    )

    expect(columns[0]?.cards.map((card) => card.id)).toEqual(['opp-2'])
    expect(columns[1]?.cards.map((card) => card.id)).toEqual(['opp-1', 'opp-3'])
  })

  it('preserves the order the rows arrive in, which is pinned first', () => {
    const columns = toColumns(
      [
        makeRow({ id: 'pinned', stageId: 'stage-a', isPinned: true }),
        makeRow({ id: 'plain', stageId: 'stage-a' })
      ],
      [contacted]
    )

    expect(columns[0]?.cards.map((card) => card.id)).toEqual(['pinned', 'plain'])
  })

  // A stage deleted while the rows were cached: no column to hold the row, so it is left out.
  it('drops a row whose stage is not in the list', () => {
    const columns = toColumns([makeRow({ stageId: 'stage-gone' })], [contacted])

    expect(columns.flatMap((column) => column.cards)).toEqual([])
  })
})

describe('withPatchedRow', () => {
  const now = new Date('2026-10-07T10:00:00Z')
  const rows = [
    makeRow({ id: 'pinned', stageId: 'stage-b', isPinned: true }),
    makeRow({ id: 'recent', stageId: 'stage-b' }),
    makeRow({ id: 'old', stageId: 'stage-a' })
  ]

  it('applies the patch and stamps the write', () => {
    const moved = withPatchedRow(rows, 'old', { stageId: 'stage-b' }, now).find(
      (row) => row.id === 'old'
    )

    expect(moved?.stageId).toBe('stage-b')
    expect(moved?.updatedAt).toBe(now)
  })

  // Same order the server returns once `updatedAt` is bumped: pinned first, then most recent.
  it('leads the unpinned rows, below the pinned ones', () => {
    const ids = withPatchedRow(rows, 'old', { stageId: 'stage-b' }, now).map((row) => row.id)

    expect(ids).toEqual(['pinned', 'old', 'recent'])
  })

  it('leads everything once pinned', () => {
    const ids = withPatchedRow(rows, 'old', { isPinned: true }, now).map((row) => row.id)

    expect(ids[0]).toBe('old')
  })

  it('drops below the pinned rows once unpinned', () => {
    const ids = withPatchedRow(rows, 'pinned', { isPinned: false }, now).map((row) => row.id)

    expect(ids).toEqual(['pinned', 'recent', 'old'])
  })

  it('returns the rows untouched for an unknown id', () => {
    expect(withPatchedRow(rows, 'missing', { stageId: 'stage-a' }, now)).toBe(rows)
  })
})

describe('isTerminalStage', () => {
  it('flags the outcome stages', () => {
    expect(isTerminalStage(makeStage({ systemKey: 'rejected' }))).toBe(true)
    expect(isTerminalStage(makeStage({ systemKey: 'ghosted' }))).toBe(true)
  })

  it('leaves steps and free stages alone', () => {
    expect(isTerminalStage(makeStage({ systemKey: 'interview' }))).toBe(false)
    expect(isTerminalStage(makeStage({ systemKey: null }))).toBe(false)
  })
})
