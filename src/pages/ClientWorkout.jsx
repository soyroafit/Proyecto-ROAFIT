import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const inputStyle = {
  background: '#101012',
  border: '1px solid #2A2A2F',
  borderRadius: 8,
  padding: '8px 10px',
  color: '#F5F4F0',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  width: 70
}

export default function ClientWorkout({ session, dayId, dayLabel, onBack }) {
  const [exercises, setExercises] = useState([])
  const [loggedByExercise, setLoggedByExercise] = useState({})
  const [drafts, setDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadAll() {
    setLoading(true)
    const { data: exs, error: exError } = await supabase
      .from('planned_exercises')
      .select('id, name, target_sets, target_reps, target_weight_kg, target_rir')
      .eq('workout_day_id', dayId)
      .order('order_index')

    if (exError) {
      setError(exError.message)
      setLoading(false)
      return
    }
    setExercises(exs || [])

    const ids = (exs || []).map((e) => e.id)
    if (ids.length > 0) {
      const { data: logs, error: logsError } = await supabase
        .from('logged_sets')
        .select('id, planned_exercise_id, set_number, actual_reps, actual_weight_kg')
        .eq('client_id', session.user.id)
        .in('planned_exercise_id', ids)
        .order('set_number')

      if (!logsError) {
        const grouped = {}
        for (const log of logs || []) {
          if (!grouped[log.planned_exercise_id]) grouped[log.planned_exercise_id] = []
          grouped[log.planned_exercise_id].push(log)
        }
        setLoggedByExercise(grouped)
      }

      const initialDrafts = {}
      for (const ex of exs || []) {
        initialDrafts[ex.id] = {
          weight: ex.target_weight_kg != null ? String(ex.target_weight_kg) : '',
          reps: String(ex.target_reps)
        }
      }
      setDrafts(initialDrafts)
    }
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [dayId])

  function updateDraft(exId, field, value) {
    setDrafts((prev) => ({ ...prev, [exId]: { ...prev[exId], [field]: value } }))
  }

  async function handleLogSet(exercise) {
    const draft = drafts[exercise.id] || {}
    const currentLogs = loggedByExercise[exercise.id] || []
    const nextSetNumber = currentLogs.length + 1

    const { error: insertError } = await supabase.from('logged_sets').insert({
      planned_exercise_id: exercise.id,
      client_id: session.user.id,
      set_number: nextSetNumber,
      actual_reps: Number(draft.reps),
      actual_weight_kg: Number(draft.weight)
    })

    if (insertError) {
      setError(insertError.message)
      return
    }
    loadAll()
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', background: '#101012', color: '#8E8E94', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>Cargando...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#101012', color: '#F5F4F0', fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif", padding: 24, boxSizing: 'border-box' }}>
      <button onClick={onBack} style={{ background: 'transparent', border: '1px solid #2A2A2F', color: '#C8C8CC', borderRadius: 100, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 20 }}>
        Volver a mi programa
      </button>

      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>{dayLabel}</div>

      {error && <div style={{ fontSize: 13, color: '#FF6B7F', marginBottom: 16 }}>{error}</div>}

      {exercises.length === 0 && (
        <div style={{ background: '#1B1B1F', border: '1px dashed #2A2A2F', borderRadius: 12, padding: 20, textAlign: 'center', color: '#8E8E94', fontSize: 13 }}>
          Este dia todavia no tiene ejercicios cargados.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {exercises.map((ex) => {
          const logs = loggedByExercise[ex.id] || []
          const draft = drafts[ex.id] || { weight: '', reps: '' }
          return (
            <div key={ex.id} style={{ background: '#1B1B1F', border: '1px solid #2A2A2F', borderRadius: 14, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{ex.name}</div>
              <div style={{ fontSize: 12, color: '#8E8E94', marginTop: 2, marginBottom: 10 }}>
                Objetivo: {ex.target_sets} x {ex.target_reps}{ex.target_weight_kg ? ' - ' + ex.target_weight_kg + ' kg' : ''} - RIR {ex.target_rir}
              </div>

              {logs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                  {logs.map((log) => (
                    <div key={log.id} style={{ fontSize: 12, color: '#8AD16C' }}>
                      Serie {log.set_number}: {log.actual_weight_kg} kg x {log.actual_reps}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  style={inputStyle}
                  type="number"
                  step="0.5"
                  placeholder="Kg"
                  value={draft.weight}
                  onChange={(e) => updateDraft(ex.id, 'weight', e.target.value)}
                />
                <span style={{ fontSize: 12, color: '#8E8E94' }}>kg x</span>
                <input
                  style={inputStyle}
                  type="number"
                  placeholder="Reps"
                  value={draft.reps}
                  onChange={(e) => updateDraft(ex.id, 'reps', e.target.value)}
                />
                <span style={{ fontSize: 12, color: '#8E8E94' }}>reps</span>
                <button
                  onClick={() => handleLogSet(ex)}
                  style={{ background: '#CFFF5C', color: '#101012', border: 'none', borderRadius: 100, padding: '8px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer', marginLeft: 'auto' }}
                >
                  Registrar serie {logs.length + 1}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
