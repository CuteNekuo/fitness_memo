export interface ParsedEntry {
  abbreviation: string
  mainWeight: number
  weightDelta?: string
  warmupWeight?: number
  reps: number[]
}

export interface ParseResult {
  ok: true
  entry: ParsedEntry
}

export interface ParseError {
  ok: false
  error: string
}

// Parse a 2-line entry block:
//   Line 1: "ABBR [±|+|-]<number>k"
//   Line 2: "[<number>k | -] /rep1/rep2/..."
export function parseEntry(text: string): ParseResult | ParseError {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0)

  if (lines.length < 1) {
    return { ok: false, error: '入力が空です' }
  }

  // --- Line 1 ---
  const line1 = lines[0]
  // e.g. "WRPD 60k"  "DPS ±0k"  "SR +2.5k"  "bench -5k"
  const m1 = line1.match(/^([A-Za-z0-9]+)\s+([+\-±]?\d+(?:\.\d+)?)k$/i)
  if (!m1) {
    return { ok: false, error: `1行目のフォーマットが正しくありません: "${line1}"` }
  }

  const abbreviation = m1[1].toUpperCase()
  const mainWeight = parseFloat(m1[2].replace('±', ''))

  if (isNaN(mainWeight)) {
    return { ok: false, error: `重量が数値ではありません: "${m1[2]}"` }
  }

  const rawSign = m1[2][0]
  const weightDelta = (rawSign === '+' || rawSign === '-' || rawSign === '±')
    ? `${rawSign}${Math.abs(mainWeight)}k`
    : undefined

  // --- Line 2 (optional) ---
  let warmupWeight: number | undefined
  let reps: number[] = []

  if (lines.length >= 2) {
    const line2 = lines[1]
    // e.g. "30k /14/12"  "/10/9/8"  "- /12/10"
    const m2 = line2.match(/^(-|(\d+(?:\.\d+)?)k?)?\s*((?:\/\d+)+)$/)
    if (!m2) {
      return { ok: false, error: `2行目のフォーマットが正しくありません: "${line2}"` }
    }

    const warmupRaw = m2[1]
    if (warmupRaw && warmupRaw !== '-') {
      warmupWeight = parseFloat(warmupRaw)
      if (isNaN(warmupWeight)) {
        return { ok: false, error: `ウォームアップ重量が不正です: "${warmupRaw}"` }
      }
    }

    const repsStr = m2[3]
    reps = repsStr
      .split('/')
      .filter(s => s.length > 0)
      .map(s => parseInt(s, 10))

    if (reps.some(r => isNaN(r) || r <= 0)) {
      return { ok: false, error: 'レップ数に不正な値が含まれています' }
    }
  }

  return {
    ok: true,
    entry: { abbreviation, mainWeight, weightDelta, warmupWeight, reps },
  }
}
