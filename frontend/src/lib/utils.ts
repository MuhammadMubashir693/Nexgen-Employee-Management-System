// Singular/plural helper for count labels, e.g. pluralize(1, 'day') -> '1 day',
// pluralize(3, 'day') -> '3 days'. Pass an irregular plural as the third
// arg, e.g. pluralize(count, 'employee', 'employees') is unnecessary (regular
// 's' suffix covers it) but pluralize(count, 'child', 'children') is not.
export function pluralize(count: number, singular: string, plural?: string): string {
  const noun = count === 1 ? singular : plural ?? `${singular}s`
  return `${count} ${noun}`
}
