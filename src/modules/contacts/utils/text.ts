const PHONE_TERM = /^[+\d][\d\s.\-()]*$/

export function isPhoneTerm(term: string) {
  return PHONE_TERM.test(term)
}

export function foldForSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

export function splitFullName(fullName: string) {
  const name = fullName.trim().replace(/\s+/g, ' ')
  const at = name.lastIndexOf(' ')

  return at === -1
    ? { firstName: name, lastName: '' }
    : { firstName: name.slice(0, at), lastName: name.slice(at + 1) }
}
