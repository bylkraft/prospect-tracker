// Shared by the table and its skeleton so the two can't drift apart.
export const TABLE_LAYOUT = 'grid min-w-200'
export const TABLE_CARD_LAYOUT = 'grid min-w-0 @3xl:min-w-200'
export const HEADER_ROW_LAYOUT = 'bg-secondary border-border grid border-b'
export const ROW_LAYOUT = 'border-border-soft grid items-stretch border-b'

// Runtime tracks go through a CSS variable, never a built class — see docs/reference/kanban-view.md
export type GridColumns =
  { gridTemplate: string; gridTracks?: never } | { gridTracks: string; gridTemplate?: never }

export function gridColumns({ gridTemplate, gridTracks }: GridColumns) {
  return gridTracks === undefined
    ? { className: gridTemplate, style: undefined }
    : {
        className: 'grid-cols-(--table-columns)',
        style: { '--table-columns': gridTracks } as React.CSSProperties
      }
}

export const CELL_LAYOUT =
  'text-secondary-foreground flex min-w-0 items-center overflow-hidden p-3.5 whitespace-nowrap'
