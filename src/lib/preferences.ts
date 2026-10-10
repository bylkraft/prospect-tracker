import { createIsomorphicFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'

export const PREFERENCE_COOKIES = {
  sidebar: 'sidebar_state',
  trackerDisplay: 'tracker_display'
} as const

type PreferenceCookie = (typeof PREFERENCE_COOKIES)[keyof typeof PREFERENCE_COOKIES]

const ONE_YEAR = 60 * 60 * 24 * 365

export const readPreference = createIsomorphicFn()
  .server((name: PreferenceCookie) => getCookie(name))
  .client((name: PreferenceCookie) => {
    const prefix = `${name}=`
    const entry = document.cookie.split('; ').find((cookie) => cookie.startsWith(prefix))

    return entry === undefined ? undefined : decodeURIComponent(entry.slice(prefix.length))
  })

export function writePreference(name: PreferenceCookie, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR}; samesite=lax`
}
