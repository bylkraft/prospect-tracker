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
  name: string
  isPending: boolean
  onConfirm: () => void
}

export function DeleteContactDialog({ open, onOpenChange, name, isPending, onConfirm }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2 className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>{m.contact_deleteTitle()}</AlertDialogTitle>
          <AlertDialogDescription>{m.contact_deleteDescription({ name })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{m.common_cancel()}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" loading={isPending} onClick={onConfirm}>
            {m.contact_deleteConfirm()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
