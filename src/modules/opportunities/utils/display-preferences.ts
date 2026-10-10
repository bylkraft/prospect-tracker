import { PREFERENCE_COOKIES, readPreference, writePreference } from '@/lib/preferences'
import { parseHiddenFields, sortsOnHidden } from '@/modules/opportunities/utils/display-settings'
import {
  OPPORTUNITIES_SEARCH_DEFAULTS,
  opportunitiesSearchSchema,
  type OpportunitiesSearch
} from '@/modules/opportunities/opportunities-schema'

type TrackerDisplay = Pick<OpportunitiesSearch, 'view' | 'hidden'>

const DEFAULT_DISPLAY: TrackerDisplay = {
  view: OPPORTUNITIES_SEARCH_DEFAULTS.view,
  hidden: OPPORTUNITIES_SEARCH_DEFAULTS.hidden
}

// Same normalisation as the URL: a cookie is user input too.
const trackerDisplaySchema = opportunitiesSearchSchema.pick({ view: true, hidden: true })

export function parseTrackerDisplay(raw: string | undefined): TrackerDisplay {
  if (raw === undefined) return DEFAULT_DISPLAY

  try {
    return trackerDisplaySchema.parse(JSON.parse(raw))
  } catch {
    return DEFAULT_DISPLAY
  }
}

// A default in the URL is indistinguishable from an absent one, since stripSearchParams removes it.
export function withRememberedDisplay(search: TrackerDisplay, remembered: TrackerDisplay) {
  return {
    view: search.view === DEFAULT_DISPLAY.view ? remembered.view : search.view,
    hidden: search.hidden === DEFAULT_DISPLAY.hidden ? remembered.hidden : search.hidden
  }
}

// Hiding the sorted column takes its header, the only control that could clear the sort, so the
// sort goes with it.
export function withDisplay(search: OpportunitiesSearch, display: TrackerDisplay) {
  const clearsSort = sortsOnHidden(search.sort, parseHiddenFields(display.hidden))

  return {
    ...search,
    ...display,
    ...(clearsSort && {
      sort: OPPORTUNITIES_SEARCH_DEFAULTS.sort,
      page: OPPORTUNITIES_SEARCH_DEFAULTS.page
    })
  }
}

export function readTrackerDisplay() {
  return parseTrackerDisplay(readPreference(PREFERENCE_COOKIES.trackerDisplay))
}

// For links into the tracker: a fresh search, but the display the user last chose. They may be
// followed from the tracker itself, where beforeLoad does not reapply it.
export function rememberedTrackerSearch(patch: Partial<OpportunitiesSearch> = {}) {
  return { ...OPPORTUNITIES_SEARCH_DEFAULTS, ...readTrackerDisplay(), ...patch }
}

export function rememberTrackerDisplay({ view, hidden }: TrackerDisplay) {
  writePreference(PREFERENCE_COOKIES.trackerDisplay, JSON.stringify({ view, hidden }))
}
