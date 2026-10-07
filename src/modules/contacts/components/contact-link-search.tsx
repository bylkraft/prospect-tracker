import { useMemo, useState } from 'react'
import { Autocomplete } from '@base-ui/react/autocomplete'
import { Plus, Search, X } from 'lucide-react'

import {
  ComboboxCollection,
  ComboboxContent,
  ComboboxGroup,
  ComboboxInput,
  ComboboxLabel,
  ComboboxList,
  useComboboxAnchor
} from '@/components/ui/combobox'
import { InputGroupAddon, InputGroupButton } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { m } from '@/i18n/paraglide/messages'
import { getLocale } from '@/i18n/paraglide/runtime'
import { cn } from '@/lib/utils'
import { ContactIdentity } from '@/modules/contacts/components/contact-identity'
import { usePickerContacts } from '@/modules/contacts/hooks/use-contacts'
import { contactDisplayName, matchRange, relativeDay } from '@/modules/contacts/utils/display'
import { foldForSearch } from '@/modules/contacts/utils/text'
import type { PickerContact } from '@/modules/contacts/contacts-types'

type Props = {
  linkedIds: string[]
  onPick: (contact: PickerContact) => void
  onCreateNew: (term: string) => void
}

type Row = { kind: 'contact'; contact: PickerContact } | { kind: 'create' }
type Section = { key: 'contacts' | 'create'; items: Row[] }

const CREATE_ROW: Row = { kind: 'create' }

const ITEM =
  'group/item relative flex w-full min-h-11 cursor-default items-center rounded-lg px-2.25 py-1.5 text-sm outline-hidden select-none data-highlighted:bg-primary/10 max-sm:min-h-13'

export function ContactLinkSearch({ linkedIds, onPick, onCreateNew }: Props) {
  const anchor = useComboboxAnchor()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const term = query.trim()
  const { data, isFetching, isStale } = usePickerContacts(term, linkedIds, open)

  const contacts = useMemo(() => {
    if (!isStale) return data ?? []
    const needle = foldForSearch(term)
    return (data ?? []).filter(
      (contact) => needle !== '' && foldForSearch(contactDisplayName(contact)).includes(needle)
    )
  }, [data, isStale, term])

  // A new array on every render would reset the highlight.
  const sections = useMemo<Section[]>(
    () => [
      ...(contacts.length > 0
        ? [
            {
              key: 'contacts' as const,
              items: contacts.map((contact): Row => ({ kind: 'contact', contact }))
            }
          ]
        : []),
      { key: 'create', items: [CREATE_ROW] }
    ],
    [contacts]
  )

  const act = (row: Row) => {
    setQuery('')
    if (row.kind === 'contact') onPick(row.contact)
    else onCreateNew(term)
  }

  return (
    <Autocomplete.Root
      items={sections}
      value={query}
      onValueChange={(next, { reason }) => {
        // A row acts; Base UI would otherwise write its label into the bar.
        if (reason !== 'item-press') setQuery(next)
      }}
      open={open}
      onOpenChange={setOpen}
      itemToStringValue={(row: Row) =>
        row.kind === 'contact' ? contactDisplayName(row.contact) : term
      }
      filter={null}
      autoHighlight="always"
      keepHighlight
      openOnInputClick
    >
      <div
        ref={anchor}
        className="bg-secondary flex items-center rounded-b-[11px] has-[input:focus-visible]:shadow-[inset_0_0_0_1.5px_var(--color-primary)]"
      >
        <ComboboxInput
          showTrigger={false}
          aria-label={m.contact_linkSearchLabel()}
          placeholder={isFocused ? m.contact_linkSearchPlaceholder() : m.contact_linkSearchIdle()}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            'h-11.5 grow rounded-none border-0 bg-transparent shadow-none max-sm:h-13.5 dark:bg-transparent',
            'has-[[data-slot=input-group-control]:focus-visible]:ring-0',
            '*:data-[slot=input-group-control]:font-medium',
            '*:data-[slot=input-group-control]:placeholder:text-foreground focus-within:*:data-[slot=input-group-control]:placeholder:text-muted-foreground focus-within:*:data-[slot=input-group-control]:font-normal'
          )}
        >
          <InputGroupAddon align="inline-start" className="pl-3.5">
            {isFetching && open ? (
              <Spinner className="text-primary size-4" />
            ) : (
              <Search className="text-primary size-4" />
            )}
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            <Autocomplete.Clear
              aria-label={m.common_clear()}
              render={<InputGroupButton size="icon-xs" className="rounded-full" />}
            >
              <X />
            </Autocomplete.Clear>
          </InputGroupAddon>
        </ComboboxInput>

        <InputGroupButton
          size="sm"
          onClick={() => act(CREATE_ROW)}
          className="text-foreground mr-1.5 ml-1 h-8.5 gap-1.5 px-2.75 max-sm:h-11"
        >
          <Plus className="size-3.5" />
          {m.contact_createShort()}
        </InputGroupButton>
      </div>

      <ComboboxContent
        anchor={anchor}
        sideOffset={6}
        className="flex w-(--anchor-width) min-w-(--anchor-width) flex-col rounded-xl p-0"
      >
        <Autocomplete.Status>
          {contacts.length === 0 && (isFetching || term) ? (
            <p className="text-muted-foreground px-3.5 pt-3 pb-2.5 text-xs">
              {isFetching ? m.contact_pickerSearching() : m.contact_linkNoResults()}
            </p>
          ) : null}
        </Autocomplete.Status>
        <ComboboxList className="flex max-h-none min-h-0 flex-col overflow-visible p-0">
          {(section: Section) =>
            section.key === 'contacts' ? (
              <ComboboxGroup
                key={section.key}
                items={section.items}
                className="flex min-h-0 flex-col"
              >
                <ComboboxLabel className="text-2xs px-3.5 pt-2.5 pb-1 font-semibold tracking-[0.08em] uppercase">
                  {term
                    ? m.contact_pickerResults({ count: contacts.length })
                    : m.contact_pickerRecent()}
                </ComboboxLabel>
                <div className="min-h-0 overflow-y-auto overscroll-contain px-1.25 pt-0.5 pb-1.25">
                  <ComboboxCollection>
                    {(row: Row) =>
                      row.kind === 'contact' ? (
                        <ContactOption
                          key={row.contact.id}
                          row={row}
                          contact={row.contact}
                          term={term}
                          onAct={act}
                        />
                      ) : null
                    }
                  </ComboboxCollection>
                </div>
              </ComboboxGroup>
            ) : (
              <ComboboxGroup
                key={section.key}
                items={section.items}
                className="border-border flex-none border-t p-1.25"
              >
                <ComboboxCollection>
                  {(row: Row) => (
                    <Autocomplete.Item
                      key="create"
                      value={row}
                      onClick={() => act(row)}
                      className={cn(ITEM, 'gap-2.5 max-sm:min-h-12')}
                    >
                      <Plus className="text-primary size-3.75" />
                      <span className="grow truncate">
                        {term
                          ? m.contact_linkCreateNamed({ name: term })
                          : m.contact_linkCreateNew()}
                      </span>
                      <span
                        aria-hidden
                        className="text-muted-foreground hidden flex-none text-xs sm:inline sm:group-data-highlighted/item:hidden"
                      >
                        {m.contact_pickerKeyboardHint()}
                      </span>
                      <EnterKey />
                    </Autocomplete.Item>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            )
          }
        </ComboboxList>
      </ComboboxContent>
    </Autocomplete.Root>
  )
}

function ContactOption({
  row,
  contact,
  term,
  onAct
}: {
  row: Row
  contact: PickerContact
  term: string
  onAct: (row: Row) => void
}) {
  return (
    <Autocomplete.Item value={row} onClick={() => onAct(row)} className={cn(ITEM, 'gap-2.75')}>
      <ContactIdentity
        contact={contact}
        showRelationship
        title={<HighlightedName contact={contact} term={term} />}
        subtitle={pickerMeta(contact, term !== '')}
        className="grow text-sm"
      />
      <EnterKey />
    </Autocomplete.Item>
  )
}

function EnterKey() {
  return (
    <kbd
      aria-hidden
      className="border-border bg-card text-muted-foreground hidden h-5.5 flex-none items-center rounded-md border px-1.75 font-sans text-xs font-medium sm:group-data-highlighted/item:inline-flex"
    >
      {m.contact_pickerEnter()} ↵
    </kbd>
  )
}

function pickerMeta(contact: PickerContact, isSearching: boolean) {
  const when =
    !isSearching && contact.lastLinkedAt
      ? m.contact_linkedWhen({
          when: relativeDay(contact.lastLinkedAt, new Date(), getLocale())
        })
      : m.contact_opportunityCount({ count: contact.opportunityCount })

  return [contact.company, when].filter(Boolean).join(' · ')
}

function HighlightedName({ contact, term }: { contact: PickerContact; term: string }) {
  const name = contactDisplayName(contact)
  const range = matchRange(name, term)
  if (!range) return name

  return (
    <>
      {name.slice(0, range.start)}
      <mark className="text-primary bg-transparent font-bold">
        {name.slice(range.start, range.end)}
      </mark>
      {name.slice(range.end)}
    </>
  )
}
