import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

import { Button, buttonVariants } from '@/components/ui/button'
import { QueryGate } from '@/components/query-gate'
import { SkeletonText } from '@/components/skeleton-text'
import { Skeleton } from '@/components/ui/skeleton'
import { m } from '@/i18n/paraglide/messages'
import { APP_ROUTES } from '@/lib/routes'
import { cn, formatDate, formatValue } from '@/lib/utils'
import {
  ContactReachabilityCard,
  ContactReachabilityCardSkeleton
} from '@/modules/contacts/components/contact-reachability-card'
import { ContactSheet } from '@/modules/contacts/components/contact-sheet'
import { DeleteContactDialog } from '@/modules/contacts/components/delete-contact-dialog'
import { RelationshipBadge } from '@/modules/contacts/components/relationship-badge'
import {
  CONTACT_NOTES_MAX_LENGTH,
  CONTACTS_SEARCH_DEFAULTS
} from '@/modules/contacts/contacts-schema'
import { useContact } from '@/modules/contacts/hooks/use-contacts'
import { useContactEditor } from '@/modules/contacts/hooks/use-contact-editor'
import { contactDisplayName, contactInitials } from '@/modules/contacts/utils/display'
import { formatDailyRate } from '@/modules/opportunities/utils/display'
import { StageBadge } from '@/modules/stages/components/stage-badge'
import { useLinkOpportunityContext } from '@/modules/opportunities/components/opportunity-editor-provider'
import type { Contact } from '@/db/schema'
import type { ContactOpportunity } from '@/modules/contacts/contacts-server'
import { toLinkedContact } from '@/modules/contacts/contacts-types'

const PANEL_LAYOUT = 'flex h-full min-h-0 flex-col gap-4 overflow-y-auto'
const CARD_LAYOUT = 'bg-card border-border flex flex-col rounded-xl border'
const COLUMNS_LAYOUT = 'grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1.35fr_1fr]'
const CARD_TITLE = 'font-heading text-md font-semibold'

const HEADER_CARD = cn(CARD_LAYOUT, 'flex-row items-start gap-3 p-4 sm:gap-4.5 sm:p-5.5')
const HEADER_MEDALLION = 'size-11 flex-none rounded-full sm:size-14.5'
const HEADER_TEXT = 'flex min-w-0 flex-1 flex-col gap-1.75 pt-0.5'
const HEADER_NAME = 'font-heading tracking-page-title text-[23px] leading-tight font-semibold'
const HEADER_NAME_ROW = 'flex flex-wrap items-center gap-2.75'
const HEADER_IDENTITY_ROW = 'flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-sm'
const HEADER_ACTIONS = 'flex flex-none items-center gap-2.25'

const NOTES_CARD = cn(CARD_LAYOUT, 'gap-2.5 p-4.5')

const DETAILS_TITLE = cn(CARD_TITLE, 'flex-none px-5.5 pt-4 pb-3')
const DETAILS_ROW = 'flex items-center gap-3 px-5.5 py-2.5'
const DETAILS_TERM = 'w-26 flex-none text-xs'

const OPPORTUNITIES_HEADER =
  'border-border-soft flex flex-none items-center gap-2.5 border-b px-4.5 py-3.5'
const OPPORTUNITIES_COUNT = 'rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums'
const OPPORTUNITY_ROW = 'flex flex-wrap items-center gap-x-4 gap-y-2 px-5.5 py-3.5'
const OPPORTUNITY_TITLE = 'flex min-w-0 grow basis-60 flex-col'

const toIsoDay = (date: Date) => new Date(date).toISOString().slice(0, 10)

const lastExchangeOf = (opportunities: ContactOpportunity[]) =>
  opportunities.reduce<string | null>(
    (latest, { lastContactAt }) =>
      lastContactAt && (!latest || lastContactAt > latest) ? lastContactAt : latest,
    null
  )

type Props = { contactId: string }

export function ContactDetail({ contactId }: Props) {
  const detailQuery = useContact(contactId)
  const editor = useContactEditor()
  const navigate = useNavigate()
  const linkOpportunity = useLinkOpportunityContext()

  return (
    <div className={PANEL_LAYOUT}>
      <QueryGate queries={[detailQuery]} skeleton={<ContactDetailSkeleton />}>
        {([detail]) => (
          <>
            <ContactHeader
              contact={detail.contact}
              onEdit={() => editor.openEdit(detail.contact)}
              onDelete={() => editor.requestDelete(detail.contact)}
            />

            <div className={COLUMNS_LAYOUT}>
              <ContactReachabilityCard
                contact={detail.contact}
                onEdit={() => editor.openEdit(detail.contact)}
              />
              <div className="flex flex-col gap-4">
                <NotesCard
                  notes={detail.contact.notes}
                  onEdit={() => editor.openEdit(detail.contact)}
                />
                <DetailsCard
                  contact={detail.contact}
                  lastExchange={lastExchangeOf(detail.opportunities)}
                />
              </div>
            </div>

            <OpportunitiesCard
              opportunities={detail.opportunities}
              onLink={() => linkOpportunity(toLinkedContact(detail.contact))}
            />

            <ContactSheet
              open={editor.editor !== null}
              onOpenChange={(next) => {
                if (!next) editor.closeEditor()
              }}
              contact={editor.editor?.contact ?? null}
              onSubmit={async (values) => void (await editor.submit(values))}
              onDelete={(target) => {
                editor.closeEditor()
                editor.requestDelete(target)
              }}
            />

            <DeleteContactDialog
              open={editor.deleting !== null}
              onOpenChange={(next) => {
                if (!next) editor.cancelDelete()
              }}
              name={contactDisplayName(detail.contact)}
              isPending={editor.isDeleting}
              onConfirm={() => {
                void editor.confirmDelete().then((deleted) => {
                  if (!deleted) return
                  void navigate({ to: APP_ROUTES.contacts, search: CONTACTS_SEARCH_DEFAULTS })
                })
              }}
            />
          </>
        )}
      </QueryGate>
    </div>
  )
}

type HeaderProps = {
  contact: Contact
  onEdit: () => void
  onDelete: () => void
}

function ContactHeader({ contact, onEdit, onDelete }: HeaderProps) {
  const identity = [contact.jobTitle, contact.company, contact.city].filter(Boolean).join(' · ')
  const needsCompleting = !contact.jobTitle && !contact.city

  return (
    <div className={HEADER_CARD}>
      <span
        className={cn(
          HEADER_MEDALLION,
          'bg-secondary text-secondary-foreground text-md flex items-center justify-center font-semibold sm:text-lg'
        )}
      >
        {contactInitials(contact)}
      </span>

      <div className={HEADER_TEXT}>
        <div className={HEADER_NAME_ROW}>
          <h1 className={cn(HEADER_NAME, 'min-w-0 break-words')}>{contactDisplayName(contact)}</h1>
          <RelationshipBadge relationship={contact.relationship} />
        </div>
        <div className={cn(HEADER_IDENTITY_ROW, 'text-muted-foreground')}>
          {identity ? <span className="max-w-full truncate">{identity}</span> : null}
          {needsCompleting ? (
            <>
              {identity ? <span className="text-border">·</span> : null}
              <span className="decoration-border underline decoration-dashed underline-offset-4">
                {m.contact_missingJobCity()}
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className={HEADER_ACTIONS}>
        <Button variant="outline" onClick={onEdit} className="gap-2 font-semibold">
          <Pencil />
          <span className="max-sm:sr-only">{m.common_edit()}</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={m.common_delete()}
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  )
}

type DetailsProps = { contact: Contact; lastExchange: string | null }

function DetailsCard({ contact, lastExchange }: DetailsProps) {
  const rows = [
    { label: m.contact_companyLabel(), value: contact.company },
    { label: m.contact_cityLabel(), value: contact.city },
    {
      label: m.contact_colLastExchange(),
      value: lastExchange ? formatDate(lastExchange) : m.contact_neverContacted()
    },
    { label: m.contact_detailAddedOn(), value: formatDate(toIsoDay(contact.createdAt)) }
  ].filter((row) => row.value)

  if (rows.length === 0) return null

  return (
    <div className={CARD_LAYOUT}>
      <h2 className={DETAILS_TITLE}>{m.contact_detailDetails()}</h2>
      <dl className="divide-border-soft divide-y">
        {rows.map((row) => (
          <div key={row.label} className={DETAILS_ROW}>
            <dt className={cn(DETAILS_TERM, 'text-muted-foreground')}>{row.label}</dt>
            <dd className="min-w-0 flex-1 truncate text-sm">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function NotesCard({ notes, onEdit }: { notes: string | null; onEdit: () => void }) {
  return (
    <div className={NOTES_CARD}>
      <div className="flex items-center gap-2.5">
        <h2 className={cn(CARD_TITLE, 'flex-1')}>{m.contact_notesLabel()}</h2>
        {notes ? (
          <span className="text-muted-foreground text-xs tabular-nums">
            {notes.length} / {CONTACT_NOTES_MAX_LENGTH}
          </span>
        ) : null}
      </div>
      {notes ? (
        <p className="text-secondary-foreground text-sm leading-relaxed whitespace-pre-wrap">
          {notes}
        </p>
      ) : (
        <Button
          variant="link"
          onClick={onEdit}
          className="text-muted-foreground hover:text-foreground h-auto w-fit p-0 font-normal"
        >
          {m.contact_detailNoNotes()}
        </Button>
      )}
    </div>
  )
}

type OpportunitiesProps = {
  opportunities: ContactOpportunity[]
  onLink: () => void
}

function OpportunitiesCard({ opportunities, onLink }: OpportunitiesProps) {
  return (
    <div className={cn(CARD_LAYOUT, 'min-h-0')}>
      <div className={OPPORTUNITIES_HEADER}>
        <h2 className={CARD_TITLE}>{m.contact_detailOpportunities()}</h2>
        <span className={cn(OPPORTUNITIES_COUNT, 'text-muted-foreground bg-secondary')}>
          {opportunities.length}
        </span>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={onLink} className="gap-1.75">
          <Plus />
          {m.contact_linkOpportunity()}
        </Button>
      </div>

      {opportunities.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-12 text-center">
          <span className="text-sm font-semibold">{m.contact_detailNoOpportunities()}</span>
          <span className="text-muted-foreground max-w-105 text-xs leading-relaxed">
            {m.contact_detailNoOpportunitiesHint()}
          </span>
          <Button variant="secondary" size="sm" onClick={onLink} className="mt-2 gap-1.75">
            <Plus />
            {m.contact_linkOpportunity()}
          </Button>
        </div>
      ) : (
        <ul className="divide-border-soft divide-y">
          {opportunities.map((opportunity) => (
            <li
              key={opportunity.id}
              className={cn(OPPORTUNITY_ROW, opportunity.isArchived && 'opacity-60')}
            >
              <div className={OPPORTUNITY_TITLE}>
                <span className="truncate text-sm font-semibold">
                  {opportunity.need ?? m.opportunity_untitled()}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {[opportunity.esn, opportunity.endClient].filter(Boolean).join(' · ') || '—'}
                </span>
              </div>

              <StageBadge
                name={opportunity.stageName}
                color={opportunity.stageColor}
                className="flex-none"
              />

              <span className="text-secondary-foreground flex-none text-sm font-semibold tabular-nums">
                {formatDailyRate(opportunity.dailyRate)}
              </span>

              <span className="text-muted-foreground w-22 flex-none text-right text-sm tabular-nums">
                {formatValue(
                  opportunity.lastContactAt ? formatDate(opportunity.lastContactAt) : null
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ContactDetailSkeleton() {
  const lineBar = 'bg-border-soft dark:bg-border'

  return (
    <div className={PANEL_LAYOUT}>
      <div className={HEADER_CARD}>
        <Skeleton className={HEADER_MEDALLION} />
        <div className={HEADER_TEXT}>
          <div className={HEADER_NAME_ROW}>
            <span className={cn(HEADER_NAME, 'flex h-lh items-center')}>
              <Skeleton className="h-5.5 w-56 max-w-full" />
            </span>
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className={HEADER_IDENTITY_ROW}>
            <span className="flex h-lh items-center">
              <Skeleton className={cn(lineBar, 'h-3.5 w-44')} />
            </span>
            <SkeletonText>{m.contact_missingJobCity()}</SkeletonText>
          </div>
        </div>
        <div className={HEADER_ACTIONS}>
          <SkeletonText
            className={cn(buttonVariants({ variant: 'outline' }), 'gap-2 border-transparent')}
          >
            <Pencil />
            <span className="max-sm:sr-only">{m.common_edit()}</span>
          </SkeletonText>
          <SkeletonText
            className={cn(
              buttonVariants({ variant: 'outline', size: 'icon' }),
              'border-transparent'
            )}
          >
            <Trash2 />
          </SkeletonText>
        </div>
      </div>

      <div className={COLUMNS_LAYOUT}>
        <ContactReachabilityCardSkeleton />
        <div className="flex flex-col gap-4">
          <div className={NOTES_CARD}>
            <h2 className={CARD_TITLE}>
              <SkeletonText>{m.contact_notesLabel()}</SkeletonText>
            </h2>
            <p className="text-sm">
              <SkeletonText>{m.contact_detailNoNotes()}</SkeletonText>
            </p>
          </div>

          <div className={CARD_LAYOUT}>
            <h2 className={DETAILS_TITLE}>
              <SkeletonText>{m.contact_detailDetails()}</SkeletonText>
            </h2>
            <dl className="divide-border-soft divide-y">
              {[
                m.contact_companyLabel(),
                m.contact_colLastExchange(),
                m.contact_detailAddedOn()
              ].map((label) => (
                <div key={label} className={DETAILS_ROW}>
                  <dt className={DETAILS_TERM}>
                    <SkeletonText>{label}</SkeletonText>
                  </dt>
                  <dd className="flex h-lh flex-1 items-center text-sm">
                    <Skeleton className="h-3.5 w-28 max-w-full" />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <div className={cn(CARD_LAYOUT, 'min-h-0')}>
        <div className={OPPORTUNITIES_HEADER}>
          <h2 className={CARD_TITLE}>
            <SkeletonText>{m.contact_detailOpportunities()}</SkeletonText>
          </h2>
          <SkeletonText className={OPPORTUNITIES_COUNT}>0</SkeletonText>
          <div className="flex-1" />
          <SkeletonText
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'gap-1.75 border-transparent'
            )}
          >
            <Plus />
            {m.contact_linkOpportunity()}
          </SkeletonText>
        </div>
        <div className={OPPORTUNITY_ROW}>
          <span className={OPPORTUNITY_TITLE}>
            <span className="flex h-lh items-center text-sm">
              <Skeleton className="h-3.5 w-56 max-w-full" />
            </span>
            <span className="flex h-lh items-center text-xs">
              <Skeleton className={cn(lineBar, 'h-2.75 w-36 max-w-full')} />
            </span>
          </span>
          <Skeleton className="h-5.5 w-24 flex-none rounded-full" />
          <span className="flex h-lh flex-none items-center text-sm">
            <Skeleton className="h-3.5 w-16" />
          </span>
          <span className="flex h-lh w-22 flex-none items-center justify-end text-sm">
            <Skeleton className="h-3.5 w-20" />
          </span>
        </div>
      </div>
    </div>
  )
}
