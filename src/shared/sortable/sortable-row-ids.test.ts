import { describe, expect, it } from 'vitest'

import { rowIds } from '@/shared/sortable/sortable-row-ids'

describe('positional row ids', () => {
  it('gives every slot a distinct id', () => {
    const ids = rowIds('phones', 3)

    expect(ids).toHaveLength(3)
    expect(new Set(ids).size).toBe(3)
  })

  it('keeps a slot its id when the list grows or shrinks around it', () => {
    expect(rowIds('phones', 4).slice(0, 2)).toEqual(rowIds('phones', 2))
  })

  it('namespaces by prefix so two lists in one form cannot share a target', () => {
    expect(rowIds('phones', 2).some((id) => rowIds('emails', 2).includes(id))).toBe(false)
  })
})
