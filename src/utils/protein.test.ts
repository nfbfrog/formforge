import { describe, expect, it } from 'vitest'
import { perMealFloor, proteinGramsFromWeight, suggestedPerKg } from './protein'

describe('proteinGramsFromWeight', () => {
  it('computes g/kg from pounds, rounded to 5g', () => {
    // 154 lb ≈ 69.85 kg; ×1.6 ≈ 111.8 → 110
    expect(proteinGramsFromWeight(154, 1.6)).toBe(110)
    // 132 lb ≈ 59.87 kg; ×1.2 ≈ 71.8 → 70
    expect(proteinGramsFromWeight(132, 1.2)).toBe(70)
  })
})

describe('perMealFloor', () => {
  it('targets ~0.3 g/kg per meal within the 25–40g window', () => {
    // 154 lb ≈ 69.85 kg ×0.3 ≈ 21 → clamped up to 25
    expect(perMealFloor(154)).toBe(25)
    // 220 lb ≈ 99.8 kg ×0.3 ≈ 30
    expect(perMealFloor(220)).toBe(30)
  })

  it('never exceeds the 40g per-meal ceiling', () => {
    expect(perMealFloor(320)).toBe(40)
  })
})

describe('suggestedPerKg', () => {
  it('returns the base rate for cycling users', () => {
    expect(suggestedPerKg('recomp', 'cycling')).toBe(1.6)
  })

  it('nudges up one step for peri/postmenopause (anabolic resistance)', () => {
    expect(suggestedPerKg('recomp', 'perimenopause')).toBeCloseTo(1.8)
    expect(suggestedPerKg('maintain', 'postmenopause')).toBeCloseTo(1.4)
  })

  it('never exceeds 2.0 g/kg', () => {
    expect(suggestedPerKg('athlete', 'postmenopause')).toBe(2.0)
  })
})
