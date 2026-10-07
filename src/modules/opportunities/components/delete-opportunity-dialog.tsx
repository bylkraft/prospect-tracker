import { Trash2 } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { m } from '@/i18n/paraglide/messages'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  label: string
  isPending: boolean
  onConfirm: () => void
}

export function DeleteOpportunityDialog({
  open,
  onOpenChange,
  label,
  isPending,
  onConfirm
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2 className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>{m.opportunity_deleteTitle()}</AlertDialogTitle>
          <AlertDialogDescription>
            {m.opportunity_deleteDescription({ label })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{m.common_cancel()}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" loading={isPending} onClick={onConfirm}>
            {m.opportunity_deleteConfirm()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
