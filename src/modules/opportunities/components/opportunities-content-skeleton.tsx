import { DEFAULT_STAGES } from '@/db/defaults'
import {
  OPPORTUNITIES_SILENT_COLUMN_ID,
  gridTracks,
  visibleColumnIds
} from '@/modules/opportunities/components/opportunities-table'
import { OpportunitiesToolbarSkeleton } from '@/modules/opportunities/components/opportunities-toolbar'
import { BoardSkeleton } from '@/shared/board/components/board-skeleton'
import { DataTableSkeleton } from '@/shared/table/components/data-table-skeleton'
import type { HidableField, View } from '@/modules/opportunities/utils/display-settings'

const BOARD_SKELETON_CARDS = 3

type Props = {
  view: View
  rowCount: number
  hiddenFields: readonly HidableField[]
}

export function OpportunitiesContentSkeleton({ view, rowCount, hiddenFields }: Props) {
  const columnIds = visibleColumnIds(hiddenFields)

  return (
    <>
      <OpportunitiesToolbarSkeleton />
      {view === 'kanban' ? (
        <BoardSkeleton columnCount={DEFAULT_STAGES.length} cardCount={BOARD_SKELETON_CARDS} />
      ) : (
        <DataTableSkeleton
          gridTracks={gridTracks(columnIds)}
          columnIds={columnIds}
          rowCount={rowCount}
          silentColumnId={OPPORTUNITIES_SILENT_COLUMN_ID}
        />
      )}
    </>
  )
}
