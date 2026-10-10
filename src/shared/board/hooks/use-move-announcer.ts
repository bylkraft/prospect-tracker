import { useAnnounce } from '@/shared/sortable/hooks/use-announce'
import { m } from '@/i18n/paraglide/messages'

type Options = {
  // Looked up at commit time: only the moved card needs a name.
  cardName: (cardId: string) => string | undefined
  columnName: (columnId: string) => string | undefined
  commit: (cardId: string, toColumnId: string) => void
}

// A move changes no focus and adds no text, so nothing reaches a screen reader on its own —
// same reasoning as the sortable announcer. See docs/reference/board-mechanism.md
export function useMoveAnnouncer({ cardName, columnName, commit }: Options) {
  const { message, announce } = useAnnounce()

  const commitMove = (cardId: string, toColumnId: string) => {
    const name = cardName(cardId)
    const column = columnName(toColumnId)

    commit(cardId, toColumnId)
    if (name !== undefined && column !== undefined) {
      announce(m.board_moveAnnounce({ name, column }))
    }
  }

  return { message, commitMove }
}
