export function rowIds(prefix: string, count: number) {
  return Array.from({ length: count }, (_, index) => `${prefix}-${index}`)
}
