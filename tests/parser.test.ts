import { describe, it, expect } from 'vitest'
import { parseEntry } from '../src/lib/parser'

describe('parseEntry', () => {
  describe('正常系', () => {
    it('標準: 略称 重量 / W重量 /rep/rep', () => {
      const r = parseEntry('WRPD 60k\n30k /14/12')
      expect(r.ok).toBe(true)
      if (!r.ok) return
      expect(r.entry.abbreviation).toBe('WRPD')
      expect(r.entry.mainWeight).toBe(60)
      expect(r.entry.warmupWeight).toBe(30)
      expect(r.entry.reps).toEqual([14, 12])
      expect(r.entry.weightDelta).toBeUndefined()
    })

    it('W無し: ± 記法', () => {
      const r = parseEntry('DPS ±0k\n/10/9/8')
      expect(r.ok).toBe(true)
      if (!r.ok) return
      expect(r.entry.abbreviation).toBe('DPS')
      expect(r.entry.mainWeight).toBe(0)
      expect(r.entry.weightDelta).toBe('±0k')
      expect(r.entry.warmupWeight).toBeUndefined()
      expect(r.entry.reps).toEqual([10, 9, 8])
    })

    it('W無し明示: "-" 記法', () => {
      const r = parseEntry('DPCF 30k\n- /12/10')
      expect(r.ok).toBe(true)
      if (!r.ok) return
      expect(r.entry.abbreviation).toBe('DPCF')
      expect(r.entry.mainWeight).toBe(30)
      expect(r.entry.warmupWeight).toBeUndefined()
      expect(r.entry.reps).toEqual([12, 10])
    })

    it('小数点の重量', () => {
      const r = parseEntry('SR 52.5k\n/12/10')
      expect(r.ok).toBe(true)
      if (!r.ok) return
      expect(r.entry.mainWeight).toBe(52.5)
    })

    it('プラス記号の重量変動', () => {
      const r = parseEntry('BENCH +2.5k\n40k /10/10/10')
      expect(r.ok).toBe(true)
      if (!r.ok) return
      expect(r.entry.mainWeight).toBe(2.5)
      expect(r.entry.weightDelta).toBe('+2.5k')
    })

    it('マイナス記号の重量変動', () => {
      const r = parseEntry('SQ -5k\n/8/8')
      expect(r.ok).toBe(true)
      if (!r.ok) return
      expect(r.entry.weightDelta).toBe('-5k')
    })

    it('1行のみ（2行目省略）', () => {
      const r = parseEntry('PUSH 50k')
      expect(r.ok).toBe(true)
      if (!r.ok) return
      expect(r.entry.reps).toEqual([])
    })

    it('小文字略称は大文字に正規化', () => {
      const r = parseEntry('wrpd 60k\n/10')
      expect(r.ok).toBe(true)
      if (!r.ok) return
      expect(r.entry.abbreviation).toBe('WRPD')
    })

    it('前後の余白を無視する', () => {
      const r = parseEntry('  WRPD 60k  \n  30k /14/12  ')
      expect(r.ok).toBe(true)
    })
  })

  describe('異常系', () => {
    it('空文字', () => {
      const r = parseEntry('')
      expect(r.ok).toBe(false)
    })

    it('1行目フォーマット崩れ（単位なし）', () => {
      const r = parseEntry('WRPD 60')
      expect(r.ok).toBe(false)
    })

    it('1行目フォーマット崩れ（略称なし）', () => {
      const r = parseEntry('60k\n/10')
      expect(r.ok).toBe(false)
    })

    it('2行目フォーマット崩れ（スラッシュなし）', () => {
      const r = parseEntry('WRPD 60k\n14 12')
      expect(r.ok).toBe(false)
    })

    it('レップ数が0', () => {
      const r = parseEntry('WRPD 60k\n/0/10')
      expect(r.ok).toBe(false)
    })
  })
})
