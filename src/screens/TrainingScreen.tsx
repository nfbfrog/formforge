import { useState } from 'react'
import { ChevronRight, Dumbbell } from 'lucide-react'
import { sessions } from '../data'
import { SectionHeading } from '../App'
import { SessionLogger } from '../components/SessionLogger'

export function TrainingScreen() {
  const [selectedId, setSelectedId] = useState<string>(sessions[0].id)
  const [rampOpen, setRampOpen] = useState(() => window.innerWidth >= 720)
  const selected = sessions.find((session) => session.id === selectedId) ?? sessions[0]

  return (
    <div className="content-stack">
      <section className="ramp-panel">
        <button type="button" className="ramp-header" onClick={() => setRampOpen(!rampOpen)} aria-expanded={rampOpen}>
          <span><strong>2-4 week ramp-in</strong><small>Earn the full program gradually.</small></span>
          <ChevronRight size={19} className={rampOpen ? 'rotated' : ''} />
        </button>
        {rampOpen ? (
          <div className="ramp-steps">
            <p><b>Week 1</b><span>2 sessions, 2 sets per exercise, leave 3-4 reps in reserve.</span></p>
            <p><b>Week 2</b><span>3 sessions, mostly 2 sets, controlled tempo.</span></p>
            <p><b>Weeks 3-4</b><span>Move toward 4 sessions only if sleep, joints, and recovery are steady.</span></p>
          </div>
        ) : null}
      </section>

      <section>
        <SectionHeading title="Four-day split" detail="Select a session, then log the work you actually completed." />
        <div className="session-tabs" role="tablist">
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              role="tab"
              aria-selected={selected.id === session.id}
              className={selected.id === session.id ? 'active' : ''}
              onClick={() => setSelectedId(session.id)}
            >
              {session.name}
            </button>
          ))}
        </div>
        <SessionLogger session={selected} />
      </section>

      <section className="training-rules">
        <Dumbbell size={22} />
        <div>
          <h3>Progressive overload, without theatrics</h3>
          <p>Beat one number with clean form: a rep, a small amount of weight, or better control. Deload around every 8 weeks or earlier when performance, sleep, or joints trend down. Swap any exercise that repeatedly hurts.</p>
        </div>
      </section>
    </div>
  )
}

