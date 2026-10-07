import { ExternalLink, Link2, Mail, Phone, Plus } from 'lucide-react'

import { AddButton } from '@/components/add-button'
import { Button, buttonVariants } from '@/components/ui/button'
import { CopyButton } from '@/components/copy-button'
import { SkeletonText } from '@/components/skeleton-text'
import { cn } from '@/lib/utils'
import { m } from '@/i18n/paraglide/messages'
import { emailLabelText, phoneLabelText } from '@/modules/contacts/utils/display'
import type { Contact } from '@/db/schema'

type Props = {
  contact: Contact
  onEdit: () => void
}

export function ContactReachabilityCard({ contact, onEdit }: Props) {
  const [primaryPhone, ...otherPhones] = contact.phones
  const [primaryEmail, ...otherEmails] = contact.emails
  const isEmpty = !primaryPhone && !primaryEmail && !contact.linkedinUrl

  if (isEmpty) return <ReachabilityEmpty onEdit={onEdit} />

  return (
    <div className="bg-card border-border flex flex-col rounded-xl border">
      <div className="flex flex-none items-center gap-2.5 px-4.5 pt-3.75 pb-3.25">
        <h2 className="font-heading text-md flex-1 font-semibold">{m.contact_colReachability()}</h2>
      </div>

      <ul>
        {primaryPhone ? (
          <Entry
            icon={<Phone />}
            value={primaryPhone.value}
            hint={[phoneLabelText(primaryPhone.label), m.contact_primaryPhone()]
              .filter(Boolean)
              .join(' · ')}
            isPrimary
            tabular
          />
        ) : null}

        {otherPhones.map((phone, index) => (
          <Entry key={index} value={phone.value} hint={phoneLabelText(phone.label)} tabular />
        ))}

        {primaryEmail ? (
          <Entry
            icon={<Mail />}
            value={primaryEmail.value}
            hint={emailLabelText(primaryEmail.label)}
            startsGroup
          />
        ) : null}

        {otherEmails.map((email, index) => (
          <Entry key={index} value={email.value} hint={emailLabelText(email.label)} />
        ))}

        {contact.linkedinUrl ? (
          <Entry
            icon={<Link2 />}
            value={m.contact_linkedinProfile()}
            hint={contact.linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\//, '')}
            startsGroup
            action={
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<a href={contact.linkedinUrl} target="_blank" rel="noreferrer noopener" />}
                className="h-7 flex-none gap-1.75 rounded-full px-2.75 text-xs font-normal"
              >
                {m.contact_open()}
                <ExternalLink />
              </Button>
            }
          />
        ) : null}
      </ul>

      <div className="mt-auto flex flex-col p-3.5 pt-3">
        <AddButton label={m.contact_addReachability()} onClick={onEdit} />
      </div>
    </div>
  )
}

const secondaryChips = () => [
  m.contact_addEmailChip(),
  m.contact_addLinkedinChip(),
  m.contact_addJobChip(),
  m.contact_addCityChip(),
  m.contact_addNotesChip()
]

const EMPTY_CARD = 'bg-card border-border flex flex-col gap-4 rounded-xl border p-5.5'
const EMPTY_TITLE = 'font-heading text-md flex-1 font-semibold'
const EMPTY_BODY = 'max-w-150 text-sm leading-relaxed text-pretty'
const CHIP_ROW = 'flex flex-wrap gap-2.25'

function ReachabilityEmpty({ onEdit }: { onEdit: () => void }) {
  return (
    <div className={EMPTY_CARD}>
      <div className="flex items-center gap-2.5">
        <h2 className={EMPTY_TITLE}>{m.contact_colReachability()}</h2>
        <span className="text-muted-foreground text-xs">{m.contact_noReachability()}</span>
      </div>

      <p className={cn(EMPTY_BODY, 'text-muted-foreground')}>{m.contact_reachabilityEmptyBody()}</p>

      <div className={CHIP_ROW}>
        <Button onClick={onEdit} className="gap-2 font-semibold">
          <Plus />
          {m.contact_addPhoneChip()}
        </Button>
        {secondaryChips().map((chip) => (
          <Button
            key={chip}
            variant="outline"
            onClick={onEdit}
            className="text-foreground gap-2 border-dashed font-normal"
          >
            <Plus className="text-muted-foreground" />
            {chip}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function ContactReachabilityCardSkeleton() {
  const chip = cn(buttonVariants({ variant: 'outline' }), 'border-transparent gap-2')

  return (
    <div className={EMPTY_CARD}>
      <div className="flex items-center gap-2.5">
        <h2 className={EMPTY_TITLE}>
          <SkeletonText>{m.contact_colReachability()}</SkeletonText>
        </h2>
        <SkeletonText className="text-xs">{m.contact_noReachability()}</SkeletonText>
      </div>

      <p className={EMPTY_BODY}>
        <SkeletonText>{m.contact_reachabilityEmptyBody()}</SkeletonText>
      </p>

      <div className={CHIP_ROW}>
        {[m.contact_addPhoneChip(), ...secondaryChips()].map((label) => (
          <SkeletonText key={label} className={chip}>
            <Plus />
            {label}
          </SkeletonText>
        ))}
      </div>
    </div>
  )
}

type EntryProps = {
  icon?: React.ReactNode
  value: string
  hint?: string | null
  isPrimary?: boolean
  tabular?: boolean
  startsGroup?: boolean
  action?: React.ReactNode
}

function Entry({ icon, value, hint, isPrimary, tabular, startsGroup, action }: EntryProps) {
  return (
    <li
      className={cn(
        'flex items-center gap-3.5 border-t px-4.5',
        startsGroup ? 'border-border' : 'border-border-soft',
        isPrimary ? 'py-3.5' : 'py-2.75'
      )}
    >
      <span
        className={cn(
          'flex size-8.5 flex-none items-center justify-center rounded-lg',
          isPrimary
            ? 'bg-primary/10 text-primary'
            : icon
              ? 'bg-secondary text-muted-foreground'
              : ''
        )}
      >
        {icon ? <span className="[&>svg]:size-4">{icon}</span> : null}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            'truncate',
            tabular && 'tabular-nums',
            isPrimary ? 'text-[18px] leading-snug font-semibold' : 'text-sm'
          )}
        >
          {value}
        </span>
        {hint ? <span className="text-muted-foreground truncate text-xs">{hint}</span> : null}
      </span>

      {action ?? <CopyButton value={value} label={m.contact_copyValue()} />}
    </li>
  )
}
