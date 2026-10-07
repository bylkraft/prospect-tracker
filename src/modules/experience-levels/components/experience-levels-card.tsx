import { useState } from 'react'

import { AddButton } from '@/components/add-button'
import { AnimatedList, AnimatedListItem } from '@/components/animated-list'
import { LiveRegion } from '@/shared/sortable/components/live-region'
import { useReorderAnnouncer } from '@/shared/sortable/hooks/use-reorder-announcer'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { ExperienceLevel } from '@/db/schema'
import { m } from '@/i18n/paraglide/messages'
import { CustomizationCard } from '@/modules/customization/components/customization-card'
import {
  ExperienceLevelRow,
  ExperienceLevelRowSkeleton
} from '@/modules/experience-levels/components/experience-level-row'
import { useExperienceLevelMutations } from '@/modules/experience-levels/hooks/use-experience-level-mutations'
import { useSortableList } from '@/shared/sortable/hooks/use-sortable-list'
import { moveInList, moveToEdge } from '@/shared/sortable/sortable-utils'
import { EXPERIENCE_LEVELS_LIST_ID } from '@/modules/experience-levels/experience-levels-schema'

type Props = {
  experienceLevels: ExperienceLevel[]
  counts: Record<string, number>
}

export function ExperienceLevelsCard({ experienceLevels, counts }: Props) {
  const { create, update, reorder, remove } = useExperienceLevelMutations()
  const [pendingDelete, setPendingDelete] = useState<ExperienceLevel | null>(null)

  const { message, commitOrder } = useReorderAnnouncer(experienceLevels, (ids) =>
    reorder.mutate({ ids })
  )

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= experienceLevels.length) return

    commitOrder(
      moveInList(experienceLevels, index, direction).map((item) => item.id),
      experienceLevels[index]?.id ?? ''
    )
  }

  const moveTo = (index: number, edge: 'top' | 'bottom') =>
    commitOrder(
      moveToEdge(experienceLevels, index, edge).map((item) => item.id),
      experienceLevels[index]?.id ?? ''
    )

  useSortableList({
    listId: EXPERIENCE_LEVELS_LIST_ID,
    ids: experienceLevels.map((item) => item.id),
    onReorder: commitOrder
  })

  return (
    <>
      <CustomizationCard
        title={m.customize_levelsSectionTitle()}
        hint={m.customize_levelsSectionHint()}
      >
        <AnimatedList>
          {experienceLevels.map((experienceLevel, index) => (
            <AnimatedListItem key={experienceLevel.id}>
              <ExperienceLevelRow
                experienceLevel={experienceLevel}
                count={counts[experienceLevel.id] ?? 0}
                index={index}
                isFirst={index === 0}
                isLast={index === experienceLevels.length - 1}
                onRename={(name) => update.mutate({ id: experienceLevel.id, name })}
                onMove={(direction) => move(index, direction)}
                onMoveToTop={() => moveTo(index, 'top')}
                onMoveToBottom={() => moveTo(index, 'bottom')}
                onDelete={() => {
                  // Nothing to warn about on an unused level — delete it outright.
                  if ((counts[experienceLevel.id] ?? 0) === 0) remove.mutate(experienceLevel.id)
                  else setPendingDelete(experienceLevel)
                }}
              />
            </AnimatedListItem>
          ))}
        </AnimatedList>

        <AddButton
          label={m.customize_addLevel()}
          disabled={create.isPending}
          onClick={() => create.mutate({ name: m.customize_newLevelName() })}
        />
      </CustomizationCard>

      <LiveRegion message={message} />

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={pendingDelete ? m.customize_deleteLevelTitle({ name: pendingDelete.name }) : ''}
        description={
          pendingDelete ? m.customize_deleteLevelBody({ count: counts[pendingDelete.id] ?? 0 }) : ''
        }
        isPending={remove.isPending}
        onConfirm={() => {
          if (!pendingDelete) return

          remove.mutate(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </>
  )
}

export function ExperienceLevelsCardSkeleton({ rowCount }: { rowCount: number }) {
  return (
    <CustomizationCard
      title={m.customize_levelsSectionTitle()}
      hint={m.customize_levelsSectionHint()}
    >
      {Array.from({ length: rowCount }, (_, index) => (
        <ExperienceLevelRowSkeleton key={index} />
      ))}
      <Skeleton className="h-11 w-full rounded-md" />
    </CustomizationCard>
  )
}
