import type { Settings } from '../types'

const LB_PER_KG = 2.2046226

export type ProteinGoal = 'maintain' | 'recomp' | 'athlete'

// Evidence-graded g/kg targets (2025 Nutrients review; ISSN position stand):
// ~1.2 maintains muscle, ~1.6 supports recomposition, ~2.0 for hard-training athletes.
export const proteinGoals: Array<{ id: ProteinGoal; perKg: number; label: string; detail: string }> = [
  { id: 'maintain', perKg: 1.2, label: 'Maintain muscle', detail: '~1.2 g/kg — protect lean mass' },
  { id: 'recomp', perKg: 1.6, label: 'Recomposition', detail: '~1.6 g/kg — lose fat, build muscle' },
  { id: 'athlete', perKg: 2.0, label: 'Hard training', detail: '~2.0 g/kg — high training volume' },
]

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG
}

/** Daily protein target in grams from bodyweight and a g/kg rate, rounded to the nearest 5g. */
export function proteinGramsFromWeight(bodyWeightLb: number, perKg: number): number {
  return Math.round((lbToKg(bodyWeightLb) * perKg) / 5) * 5
}

/**
 * Per-meal protein floor in grams (~0.3 g/kg per meal), clamped to the 25–40g window
 * that drives muscle protein synthesis. Distribution matters as much as the daily total.
 */
export function perMealFloor(bodyWeightLb: number): number {
  const raw = Math.round(lbToKg(bodyWeightLb) * 0.3)
  return Math.min(40, Math.max(25, raw))
}

/**
 * Suggested g/kg rate, nudged up one step for peri/postmenopausal users — older muscle
 * shows anabolic resistance, so it needs more protein at maintained activity.
 */
export function suggestedPerKg(goal: ProteinGoal, lifeStage: Settings['lifeStage']): number {
  const base = proteinGoals.find((g) => g.id === goal)?.perKg ?? 1.6
  const olderStage = lifeStage === 'perimenopause' || lifeStage === 'postmenopause'
  return olderStage ? Math.min(2.0, base + 0.2) : base
}
