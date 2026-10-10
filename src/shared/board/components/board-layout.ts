// Shared shapes for a column board — see docs/reference/board-mechanism.md

// The row scrolls horizontally; each column scrolls on its own, so the page itself never does.
export const BOARD_LAYOUT = 'flex min-h-0 flex-1 gap-3.5 overflow-x-auto overflow-y-hidden p-4.5'

// Fixed width: columns must not shrink to nothing as the pipeline grows, which is what makes the
// horizontal scroll meaningful rather than an accident.
export const COLUMN_LAYOUT =
  'bg-secondary/50 border-border-soft flex w-80 flex-none flex-col rounded-xl border transition-colors duration-300 ease-out'

export const COLUMN_HEADER_LAYOUT =
  'flex flex-none items-center gap-2 px-3.25 pt-3.25 pb-1.5 text-sm font-semibold'

// The top padding is room for the focus ring: the scroller clips, and the first card's ring would
// lose its top edge.
export const COLUMN_SCROLLER_LAYOUT =
  'flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-2.5 pt-1 pb-2.5'

export const CARD_LAYOUT =
  'group/card border-border bg-card relative flex flex-col gap-2 rounded-lg border p-3 text-left shadow-xs'
