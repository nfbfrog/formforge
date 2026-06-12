import { useEffect, useState } from 'react'
import { Cloud, LogOut, Mail, RefreshCw, X } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { db } from '../db'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { syncLocalToSupabase } from '../lib/cloudSync'
import { perMealFloor, proteinGoals, proteinGramsFromWeight, suggestedPerKg, type ProteinGoal } from '../utils/protein'
import type { Settings, ThemePreference } from '../types'

export function SettingsPanel({ settings, onClose }: { settings: Settings; onClose: () => void }) {
  const [draft, setDraft] = useState(settings)
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [cloudMessage, setCloudMessage] = useState('')
  const [cloudBusy, setCloudBusy] = useState(false)

  useEffect(() => {
    let active = true
    let unsubscribe: (() => void) | undefined
    void getSupabase().then((client) => {
      if (!client || !active) return
      void client.auth.getUser().then(({ data }) => {
        if (active) setUser(data.user)
      })
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
      })
      unsubscribe = () => data.subscription.unsubscribe()
    })
    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  async function save() {
    await db.settings.put(draft)
    onClose()
  }

  async function sendMagicLink() {
    const supabase = await getSupabase()
    if (!supabase || !email.trim()) return
    setCloudBusy(true)
    setCloudMessage('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setCloudBusy(false)
    setCloudMessage(error ? error.message : 'Magic link sent. Check your email, then return here.')
  }

  async function syncNow() {
    if (!user) return
    setCloudBusy(true)
    setCloudMessage('')
    try {
      const result = await syncLocalToSupabase(user.id)
      setCloudMessage(`Synced ${result.dailyLogs} days, ${result.weeklyMetrics} weeks, and ${result.exerciseEntries} workout sets.`)
    } catch (error) {
      setCloudMessage(error instanceof Error ? error.message : 'Sync failed.')
    } finally {
      setCloudBusy(false)
    }
  }

  async function signOut() {
    const supabase = await getSupabase()
    if (!supabase) return
    await supabase.auth.signOut()
    setCloudMessage('Signed out. Local data is still on this device.')
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header>
          <div><span className="eyebrow">Personal targets</span><h2 id="settings-title">Plan settings</h2></div>
          <button type="button" className="icon-button" onClick={onClose} title="Close settings" aria-label="Close settings"><X size={20} /></button>
        </header>
        <ProteinBasis draft={draft} setDraft={setDraft} />
        <div className="metric-grid">
          <SettingNumber label="Protein" suffix="g" value={draft.proteinTarget} onChange={(proteinTarget) => setDraft({ ...draft, proteinTarget })} />
          <SettingNumber label="Calories" suffix="kcal" value={draft.calorieTarget} onChange={(calorieTarget) => setDraft({ ...draft, calorieTarget })} />
          <SettingNumber label="Water" suffix="oz" value={draft.waterTarget} onChange={(waterTarget) => setDraft({ ...draft, waterTarget })} />
          <SettingNumber label="Steps" suffix="/day" value={draft.stepTarget} onChange={(stepTarget) => setDraft({ ...draft, stepTarget })} />
          <SettingNumber label="Sleep" suffix="hours" value={draft.sleepTarget} onChange={(sleepTarget) => setDraft({ ...draft, sleepTarget })} />
          <label className="field">
            <span>Life stage</span>
            <select value={draft.lifeStage} onChange={(event) => setDraft({ ...draft, lifeStage: event.target.value as Settings['lifeStage'] })}>
              <option value="cycling">Cycling</option>
              <option value="perimenopause">Perimenopause</option>
              <option value="postmenopause">Postmenopause</option>
              <option value="other">Other / prefer not to say</option>
            </select>
          </label>
          <label className="field">
            <span>Appearance</span>
            <select value={draft.theme ?? 'system'} onChange={(event) => setDraft({ ...draft, theme: event.target.value as ThemePreference })}>
              <option value="system">Match device</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>
        <div className="toggle-list">
          <label><span><strong>Metabolic medication support</strong><small>Adds relevant appetite and tolerance prompts.</small></span><input type="checkbox" checked={draft.metabolicSupport} onChange={(event) => setDraft({ ...draft, metabolicSupport: event.target.checked })} /></label>
          <label><span><strong>Prescribed hormone support</strong><small>Keeps hormone-aware monitoring context visible.</small></span><input type="checkbox" checked={draft.hormoneSupport} onChange={(event) => setDraft({ ...draft, hormoneSupport: event.target.checked })} /></label>
        </div>
        <section className="cloud-panel">
          <div>
            <span><Cloud size={18} /> Cloud account</span>
            <p>{isSupabaseConfigured ? 'Optional Supabase backup/sync for this device.' : 'Supabase is not configured yet. Add Vite env vars before using cloud sync.'}</p>
          </div>
          {isSupabaseConfigured && user ? (
            <div className="cloud-actions">
              <p className="cloud-user">{user.email}</p>
              <button type="button" className="secondary-button" disabled={cloudBusy} onClick={() => void syncNow()}><RefreshCw size={15} /> Sync this device</button>
              <button type="button" className="secondary-button" disabled={cloudBusy} onClick={() => void signOut()}><LogOut size={15} /> Sign out</button>
            </div>
          ) : isSupabaseConfigured ? (
            <div className="cloud-actions">
              <label className="field">
                <span>Email</span>
                <input type="email" value={email} placeholder="you@example.com" onChange={(event) => setEmail(event.target.value)} />
              </label>
              <button type="button" className="secondary-button" disabled={cloudBusy || !email.trim()} onClick={() => void sendMagicLink()}><Mail size={15} /> Send magic link</button>
            </div>
          ) : null}
          {cloudMessage ? <p className="system-message" role="status">{cloudMessage}</p> : null}
        </section>
        <p className="settings-note">Targets are starting points, not medical prescriptions. Adjust them with a qualified professional when your history or medication requires it.</p>
        <footer><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="button" className="primary-button" onClick={() => void save()}>Save settings</button></footer>
      </section>
    </div>
  )
}

function ProteinBasis({ draft, setDraft }: { draft: Settings; setDraft: (s: Settings) => void }) {
  const goal: ProteinGoal = (proteinGoals.find((g) => g.perKg === draft.proteinPerKg)?.id) ?? 'recomp'
  const weight = draft.bodyWeightLb
  const perKg = weight ? suggestedPerKg(goal, draft.lifeStage) : null
  const suggested = weight && perKg ? proteinGramsFromWeight(weight, perKg) : null
  const olderBump = (draft.lifeStage === 'perimenopause' || draft.lifeStage === 'postmenopause') && perKg
    ? ' (nudged up for life stage)'
    : ''

  return (
    <section className="protein-basis">
      <div className="protein-basis-head">
        <span className="eyebrow">Protein basis</span>
        <p>Anchor protein to bodyweight, not a flat number. Distribution matters too — aim for the per-meal floor across the day.</p>
      </div>
      <div className="metric-grid">
        <label className="field">
          <span>Bodyweight</span>
          <div className="input-suffix">
            <input
              type="number"
              inputMode="decimal"
              min="1"
              placeholder="optional"
              value={weight ?? ''}
              onChange={(event) => setDraft({ ...draft, bodyWeightLb: event.target.value ? Number(event.target.value) : undefined })}
            />
            <small>lb</small>
          </div>
        </label>
        <label className="field">
          <span>Goal</span>
          <select
            value={goal}
            onChange={(event) => {
              const next = proteinGoals.find((g) => g.id === event.target.value)
              setDraft({ ...draft, proteinPerKg: next?.perKg })
            }}
          >
            {proteinGoals.map((g) => <option key={g.id} value={g.id}>{g.label} · {g.detail.split(' — ')[0]}</option>)}
          </select>
        </label>
      </div>
      {suggested && weight ? (
        <div className="protein-suggestion">
          <span>
            Suggested: <strong>{suggested}g/day</strong> · ~{perMealFloor(weight)}g per meal{olderBump}
          </span>
          <button
            type="button"
            className="secondary-button"
            disabled={draft.proteinTarget === suggested}
            onClick={() => setDraft({ ...draft, proteinTarget: suggested })}
          >
            {draft.proteinTarget === suggested ? 'Applied' : 'Use this'}
          </button>
        </div>
      ) : (
        <p className="protein-suggestion-empty">Add bodyweight to get a g/kg-based target and per-meal floor.</p>
      )}
    </section>
  )
}

function SettingNumber({ label, suffix, value, onChange }: { label: string; suffix: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-suffix"><input type="number" min="1" value={value} onChange={(event) => onChange(Number(event.target.value))} /><small>{suffix}</small></div>
    </label>
  )
}
