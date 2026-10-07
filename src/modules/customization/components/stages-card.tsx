import { useState } from 'react'

import { AddButton } from '@/components/add-button'
import { AnimatedList, AnimatedListItem } from '@/components/animated-list'
import { LiveRegion } from '@/shared/sortable/components/live-region'
import { useReorderAnnouncer } from '@/shared/sortable/hooks/use-reorder-announcer'
import { Skeleton } from '@/components/ui/skeleton'
import { DEFAULT_STAGES } from '@/db/defaults'
import type { Stage, StageColorToken } from '@/db/schema'
import { m } from '@/i18n/paraglide/messages'
import { ArchivedStagesSection } from '@/modules/customization/components/archived-stages-section'
import { CustomizationCard } from '@/modules/customization/components/customization-card'
import { DeleteStageBlockedDialog } from '@/modules/customization/components/delete-stage-blocked-dialog'
import { StageRow, StageRowSkeleton } from '@/modules/customization/components/stage-row'
import { useSortableList } from '@/shared/sortable/hooks/use-sortable-list'
import { useStageMutations } from '@/modules/stages/hooks/use-stage-mutations'
import { STAGES_LIST_ID } from '@/modules/stages/stages-utils'
import { moveInList, moveToEdge } from '@/shared/sortable/sortable-utils'

type Props = {
  stages: Stage[]
  counts: Map<string, number>
}

export function StagesCard({ stages, counts }: Props) {
  const { create, update, setArchived, reorder, remove } = useStageMutations()
  const [blockedStage, setBlockedStage] = useState<Stage | null>(null)

  const active = stages.filter((stage) => !stage.isArchived)
  const archived = stages.filter((stage) => stage.isArchived)

  // Archived stages ride along: reorderStages sorts them after the active ones itself.
  const { message, commitOrder } = useReorderAnnouncer(active, (activeIds) =>
    reorder.mutate({ ids: [...activeIds, ...archived.map((stage) => stage.id)] })
  )

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= active.length) return

    commitOrder(
      moveInList(active, index, direction).map((stage) => stage.id),
      active[index]?.id ?? ''
    )
  }

  const moveTo = (index: number, edge: 'top' | 'bottom') =>
    commitOrder(
      moveToEdge(active, index, edge).map((stage) => stage.id),
      active[index]?.id ?? ''
    )

  useSortableList({
    listId: STAGES_LIST_ID,
    ids: active.map((stage) => stage.id),
    onReorder: commitOrder
  })

  // No onConflict: an archived stage has no "archive instead" to offer, so it falls back to a toast.
  const deleteArchived = (id: string) => remove.mutate({ id })

  const requestDelete = (stage: Stage) =>
    remove.mutate({ id: stage.id, onConflict: () => setBlockedStage(stage) })

  return (
    <>
      <CustomizationCard
        title={m.customize_stagesSectionTitle()}
        hint={m.customize_stagesSectionHint()}
        className="overflow-visible"
        bleed={
          <>
            {archived.length > 0 && (
              <ArchivedStagesSection
                stages={archived}
                counts={counts}
                onRestore={(id) => setArchived.mutate({ id, isArchived: false })}
                onDelete={deleteArchived}
              />
            )}
            <footer className="border-border-soft flex items-center justify-between gap-3 border-t px-4.5 py-3.5">
              <span className="text-muted-foreground text-xs">{m.customize_liveChanges()}</span>
              <span className="text-muted-foreground text-xs">{m.customize_delayDrivesDue()}</span>
            </footer>
          </>
        }
      >
        <AnimatedList>
          {active.map((stage, index) => (
            <AnimatedListItem key={stage.id}>
              <StageRow
                stage={stage}
                count={counts.get(stage.id) ?? 0}
                index={index}
                isFirst={index === 0}
                isLast={index === active.length - 1}
                onRename={(name) => update.mutate({ id: stage.id, name })}
                onRecolor={(color: StageColorToken) => update.mutate({ id: stage.id, color })}
                onDelayChange={(reminderDelayDays) =>
                  update.mutate({ id: stage.id, reminderDelayDays })
                }
                onMove={(direction) => move(index, direction)}
                onMoveToTop={() => moveTo(index, 'top')}
                onMoveToBottom={() => moveTo(index, 'bottom')}
                onArchive={() => setArchived.mutate({ id: stage.id, isArchived: true })}
                onDelete={() => requestDelete(stage)}
              />
            </AnimatedListItem>
          ))}
        </AnimatedList>

        <AddButton
          label={m.customize_addStage()}
          disabled={create.isPending}
          onClick={() => create.mutate({ name: m.customize_newStageName() })}
        />
      </CustomizationCard>

      <LiveRegion message={message} />

      <DeleteStageBlockedDialog
        open={blockedStage !== null}
        onOpenChange={(open) => {
          if (!open) setBlockedStage(null)
        }}
        name={blockedStage?.name ?? ''}
        count={blockedStage ? (counts.get(blockedStage.id) ?? 0) : 0}
        isPending={setArchived.isPending}
        onArchive={() => {
          if (!blockedStage) return

          setArchived.mutate({ id: blockedStage.id, isArchived: true })
          setBlockedStage(null)
        }}
      />
    </>
  )
}

// Sized from the seed so a fresh account sees no reflow; archived stages get their own band.
const STAGE_ROWS = DEFAULT_STAGES.filter((stage) => !stage.isArchived).length
const ARCHIVED_STAGES = DEFAULT_STAGES.length - STAGE_ROWS

export function StagesCardSkeleton() {
  return (
    <CustomizationCard
      title={m.customize_stagesSectionTitle()}
      hint={m.customize_stagesSectionHint()}
      bleed={
        <>
          {/* The archived band ships collapsed, so the placeholder is its trigger row only. */}
          {ARCHIVED_STAGES > 0 && (
            <div className="border-border-soft bg-muted/55 flex items-center gap-2.5 border-t px-4.5 py-3.5">
              <Skeleton className="size-3.75 rounded-sm" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4.5 w-7 rounded-md" />
            </div>
          )}
          <footer className="border-border-soft flex items-center justify-between gap-3 border-t px-4.5 py-3.5">
            <Skeleton className="h-3 w-52" />
            <Skeleton className="h-3 w-44" />
          </footer>
        </>
      }
    >
      {Array.from({ length: STAGE_ROWS }, (_, index) => (
        <StageRowSkeleton key={index} />
      ))}
      <Skeleton className="h-11 w-full rounded-md" />
    </CustomizationCard>
  )
}
