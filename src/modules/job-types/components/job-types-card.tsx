import { useState } from 'react'

import { AddButton } from '@/components/add-button'
import { AnimatedList, AnimatedListItem } from '@/components/animated-list'
import { LiveRegion } from '@/shared/sortable/components/live-region'
import { useReorderAnnouncer } from '@/shared/sortable/hooks/use-reorder-announcer'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { JobType } from '@/db/schema'
import { m } from '@/i18n/paraglide/messages'
import { CustomizationCard } from '@/modules/customization/components/customization-card'
import { JobTypeRow, JobTypeRowSkeleton } from '@/modules/job-types/components/job-type-row'
import { useJobTypeMutations } from '@/modules/job-types/hooks/use-job-type-mutations'
import { useSortableList } from '@/shared/sortable/hooks/use-sortable-list'
import { moveInList, moveToEdge } from '@/shared/sortable/sortable-utils'
import { JOB_TYPES_LIST_ID } from '@/modules/job-types/job-types-schema'

type Props = {
  jobTypes: JobType[]
  counts: Record<string, number>
}

export function JobTypesCard({ jobTypes, counts }: Props) {
  const { create, update, reorder, remove } = useJobTypeMutations()
  const [pendingDelete, setPendingDelete] = useState<JobType | null>(null)

  const { message, commitOrder } = useReorderAnnouncer(jobTypes, (ids) => reorder.mutate({ ids }))

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= jobTypes.length) return

    commitOrder(
      moveInList(jobTypes, index, direction).map((item) => item.id),
      jobTypes[index]?.id ?? ''
    )
  }

  const moveTo = (index: number, edge: 'top' | 'bottom') =>
    commitOrder(
      moveToEdge(jobTypes, index, edge).map((item) => item.id),
      jobTypes[index]?.id ?? ''
    )

  useSortableList({
    listId: JOB_TYPES_LIST_ID,
    ids: jobTypes.map((item) => item.id),
    onReorder: commitOrder
  })

  return (
    <>
      <CustomizationCard
        title={m.customize_jobTypesSectionTitle()}
        hint={m.customize_jobTypesSectionHint()}
      >
        <AnimatedList>
          {jobTypes.map((jobType, index) => (
            <AnimatedListItem key={jobType.id}>
              <JobTypeRow
                jobType={jobType}
                count={counts[jobType.id] ?? 0}
                index={index}
                isFirst={index === 0}
                isLast={index === jobTypes.length - 1}
                onRename={(name) => update.mutate({ id: jobType.id, name })}
                onMove={(direction) => move(index, direction)}
                onMoveToTop={() => moveTo(index, 'top')}
                onMoveToBottom={() => moveTo(index, 'bottom')}
                onDelete={() => {
                  // Nothing to warn about on an unused job type — delete it outright.
                  if ((counts[jobType.id] ?? 0) === 0) remove.mutate(jobType.id)
                  else setPendingDelete(jobType)
                }}
              />
            </AnimatedListItem>
          ))}
        </AnimatedList>

        <AddButton
          label={m.customize_addJobType()}
          disabled={create.isPending}
          onClick={() => create.mutate({ name: m.customize_newJobTypeName() })}
        />
      </CustomizationCard>

      <LiveRegion message={message} />

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={pendingDelete ? m.customize_deleteJobTypeTitle({ name: pendingDelete.name }) : ''}
        description={
          pendingDelete
            ? m.customize_deleteJobTypeBody({ count: counts[pendingDelete.id] ?? 0 })
            : ''
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

export function JobTypesCardSkeleton({ rowCount }: { rowCount: number }) {
  return (
    <CustomizationCard
      title={m.customize_jobTypesSectionTitle()}
      hint={m.customize_jobTypesSectionHint()}
    >
      {Array.from({ length: rowCount }, (_, index) => (
        <JobTypeRowSkeleton key={index} />
      ))}
      <Skeleton className="h-11 w-full rounded-md" />
    </CustomizationCard>
  )
}
