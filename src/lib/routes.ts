export const APP_ROUTES = {
  home: '/',
  login: '/login',
  tracker: '/app/tracker',
  contacts: '/app/contacts',
  contactDetail: '/app/contacts/$contactId',
  customize: '/app/customize'
} as const

export const API_ROUTES = {
  authCallback: '/api/auth/callback',
  authLogout: '/api/auth/logout'
} as const

export const EXTERNAL_LINKS = {
  linkedin: 'https://www.linkedin.com/in/rabie-menad/',
  help: '#',
  feedback: '#',
  invite: '#'
} as const
