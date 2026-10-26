import { describe, expect, it } from 'vitest'
import {
  sanitizeDraft,
  parseDraft,
  toEditDraft,
  formatGrouped,
} from './format'

describe('sanitizeDraft', () => {
  it('strips leading zeros while typing', () => {
    expect(sanitizeDraft('02000')).toBe('2000')
    expect(sanitizeDraft('000')).toBe('0')
    expect(sanitizeDraft('0')).toBe('0')
    expect(sanitizeDraft('01225')).toBe('1225')
  })

  it('keeps a single leading zero before a decimal', () => {
    expect(sanitizeDraft('0.5')).toBe('0.5')
    expect(sanitizeDraft('.5')).toBe('0.5')
    expect(sanitizeDraft('00.25')).toBe('0.25')
  })

  it('strips commas and junk', () => {
    expect(sanitizeDraft('2,000,000')).toBe('2000000')
    expect(sanitizeDraft('$ 02000')).toBe('2000')
    expect(sanitizeDraft('1,225.50')).toBe('1225.50')
  })

  it('allows empty', () => {
    expect(sanitizeDraft('')).toBe('')
  })

  it('keeps only one decimal point', () => {
    expect(sanitizeDraft('1.2.3')).toBe('1.23')
  })
})

describe('parseDraft', () => {
  it('parses grouped and plain', () => {
    expect(parseDraft('2000')).toBe(2000)
    expect(parseDraft('2,000,000')).toBe(2_000_000)
    expect(parseDraft('')).toBe(0)
    expect(parseDraft('.')).toBe(0)
    expect(parseDraft('5.75')).toBe(5.75)
  })
})

describe('toEditDraft / formatGrouped', () => {
  it('edit draft has no commas and blanks zero', () => {
    expect(toEditDraft(2_000_000)).toBe('2000000')
    expect(toEditDraft(0)).toBe('')
    expect(toEditDraft(1225.5)).toBe('1225.5')
  })

  it('money display uses thousand separators', () => {
    expect(formatGrouped(2000, 'money')).toBe('2,000')
    expect(formatGrouped(2_000_000, 'money')).toBe('2,000,000')
    expect(formatGrouped(1225, 'money')).toBe('1,225')
  })

  it('percent stays plain', () => {
    expect(formatGrouped(5.75, 'percent')).toBe('5.75')
    expect(formatGrouped(65, 'percent')).toBe('65')
  })
})
