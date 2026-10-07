import { z } from 'zod/v4'

export type TableSearch = {
  sort: string
  page: number
  perPage: number
}

type TableSearchConfig<TColumn extends string> = {
  defaultPerPage: number
  pageSizes: readonly number[]
  sortColumns: readonly TColumn[]
}

export const tableQuerySchema = z.string().trim().max(200)

// `.catch()` everywhere, never `.default()`: a hand-edited URL must fall back, not throw.
export function tableSearchSchema<TColumn extends string>({
  sortColumns,
  pageSizes,
  defaultPerPage
}: TableSearchConfig<TColumn>) {
  const isSortable = (value: string): value is TColumn =>
    sortColumns.some((column) => column === value)

  const sort = z
    .string()
    .transform((value) => {
      const [column, direction] = value.split(':')

      return column && isSortable(column) && (direction === 'asc' || direction === 'desc')
        ? `${column}:${direction}`
        : ''
    })
    .catch('')

  return z.object({
    sort,
    page: z.coerce.number().int().min(1).catch(1),
    perPage: z.coerce
      .number()
      .int()
      .refine((size) => pageSizes.includes(size))
      .catch(defaultPerPage)
  })
}
