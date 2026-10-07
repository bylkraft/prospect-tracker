import * as React from 'react'
import { DynamicIcon, type IconName } from 'lucide-react/dynamic'
import { TriangleAlert } from 'lucide-react'

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
import { Button } from '@/components/ui/button'
import { FieldLegend, FieldSet } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { m } from '@/i18n/paraglide/messages'
import { cn } from '@/lib/utils'

type HeaderProps = Omit<React.ComponentProps<typeof SheetHeader>, 'title'> & {
  title: React.ReactNode
  onClose: () => void
  icon?: IconName
  description?: React.ReactNode
}

function SheetFormHeader({ icon, title, description, onClose, className, ...props }: HeaderProps) {
  return (
    <SheetHeader
      data-slot="sheet-form-header"
      className={cn(
        'border-border-soft flex-none flex-row items-center gap-3 border-b p-5.5',
        className
      )}
      {...props}
    >
      {icon && (
        <span className="bg-primary/10 text-primary flex size-9 flex-none items-center justify-center rounded-[10px]">
          <DynamicIcon name={icon} size={16} />
        </span>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <SheetTitle className="font-heading text-md font-semibold">{title}</SheetTitle>
        {description && <SheetDescription>{description}</SheetDescription>}
      </div>

      <Button
        size="icon-sm"
        variant="outline"
        onClick={onClose}
        aria-label={m.common_close()}
        className="text-secondary-foreground flex-none rounded-lg"
      >
        <DynamicIcon name="x" />
      </Button>
    </SheetHeader>
  )
}

function SheetFormSection({ title, children }: React.PropsWithChildren<{ title?: string }>) {
  return (
    <FieldSet className="gap-4">
      {title ? (
        // A legend is not a flex item, so the fieldset gap never reaches it.
        <FieldLegend
          variant="label"
          className="text-muted-foreground data-[variant=label]:text-2xs mb-3.5 flex w-full items-center gap-5 pt-2 font-semibold tracking-[0.08em] uppercase"
        >
          <Separator aria-hidden className="flex-1" />
          {title}
          <Separator aria-hidden className="flex-1" />
        </FieldLegend>
      ) : null}
      {children}
    </FieldSet>
  )
}

function SheetFormBody({ className, ...props }: React.ComponentProps<'form'>) {
  return (
    <form
      data-slot="sheet-form-body"
      className={cn(
        '@container flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-5.5 py-5',
        className
      )}
      {...props}
    />
  )
}

type FooterProps = React.ComponentProps<'div'> & {
  destructiveCta?: React.ReactNode
  secondaryCta?: React.ReactNode
  primaryCta: React.ReactNode
}

function SheetFormFooter({
  destructiveCta,
  secondaryCta,
  primaryCta,
  className,
  ...props
}: FooterProps) {
  return (
    <div
      data-slot="sheet-form-footer"
      className={cn(
        'border-border-soft flex flex-none items-center gap-2.5 border-t px-5.5 py-3.5',
        className
      )}
      {...props}
    >
      {destructiveCta}
      <div className="flex flex-1 justify-end gap-2.5 *:max-sm:flex-1">
        {secondaryCta}
        {primaryCta}
      </div>
    </div>
  )
}

type DiscardDialogProps = {
  open: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description: React.ReactNode
  confirmLabel: React.ReactNode
  cancelLabel?: React.ReactNode
}

function SheetFormDiscardDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = m.common_continue()
}: DiscardDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        data-slot="sheet-form-discard-dialog"
        className="z-70"
        forceOverlay
        overlayClassName="z-70 bg-black/42 supports-backdrop-filter:backdrop-blur-[4px]"
      >
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlert className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { SheetFormHeader, SheetFormBody, SheetFormSection, SheetFormFooter, SheetFormDiscardDialog }
