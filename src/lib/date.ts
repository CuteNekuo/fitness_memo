export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDisplay(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function today(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

// Returns Monday of the week containing the given date
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

// Returns array of 7 dates Mon–Sun
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

// "YYYY-Www" key for a week (ISO-ish, Mon-based)
export function weekKey(weekStart: Date): string {
  return toDateKey(weekStart)
}

export function fromWeekKey(key: string): Date {
  return fromDateKey(key)
}

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日']
export function dayLabel(date: Date): string {
  const day = date.getDay() // 0=Sun
  return DAY_LABELS[day === 0 ? 6 : day - 1]
}

// "YYYY-MM" key for a month
export function monthKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function fromMonthKey(key: string): { year: number; month: number } {
  const [y, m] = key.split('-').map(Number)
  return { year: y, month: m }
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month - 1 + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

// Returns calendar grid, null = empty cell. weekStartsOn: 0=Sun, 1=Mon
export function getMonthGrid(year: number, month: number, weekStartsOn: 0 | 1 = 0): (Date | null)[] {
  const first = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const dow = first.getDay() // 0=Sun
  const startPad = (dow - weekStartsOn + 7) % 7
  const cells: (Date | null)[] = Array(startPad).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month - 1, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}
