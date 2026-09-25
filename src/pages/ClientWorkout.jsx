import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const input = { background: '#101012', border: '1px solid #2A2A2F', borderRadius: 8, padding: '8px 10px', color: '#F5F4F0', fontSize: 13, width: 60, boxSizing: 'border-box' }

export default function ClientWorkout({ session, dayId, dayLabel, onBack }) {
  const [exercises, setExercises] = useState([])
  const [idx, setIdx] = useState(0)
  const [logged, setLogged] = useState({})
  const [draft, setDraft] = useState({ weight: '', reps: '' })
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadAll() {
    setLoading(true)
    const { data: exs } = await supabase.from('planned_exercises').select('id, name, target_sets, target_reps, target_weight_kg, target_rir').eq('workout_day_id', dayId).order('order_index')
    setExercises(exs || [])
    const { data: cd } = await supabase.from('client_details').select('trainer_notes').eq('id', session.user.id).maybeSingle()
    if (cd) setNote(cd.trainer_notes || '')
    const ids = (exs || []).map(e => e.id)
    if (ids.length) {
      const { data: logs } = await supabase.from('logged_sets').select('id, planned_exercise_id, set_number, actual_reps, actual_weight_kg').eq('client_id', session.user.id).in('planned_exercise_id', ids).order('set_number')
      const grouped = {}
      for (const l of logs || []) { (grouped[l.planned_exercise_id] = grouped[l.planned_exercise_id] || []).push(l) }
      setLogged(grouped)
    }
    setLoading(false)
  }
  useEffect(() => { loadAll() }, [dayId])

  const ex = exercises[idx]
  useEffect(() => {
    if (ex) setDraft({ weight: ex.target_weight_kg != null ? String(ex.target_weight_kg) : '', reps: String(ex.target_reps) })
  }, [idx, exercises.length])

  if (loading) return <div style={{ minHeight: '100vh', background: '#101012', color: '#8E8E94', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>Cargando...</div>
  if (exercises.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#101012', color: '#F5F4F0', padding: 24, fontFamily: 'sans-serif' }}>
        <button onClick={onBack} style={{ background: 'transparent', border: '1px solid #2A2A2F', color: '#C8C8CC', borderRadius: 100, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Volver</button>
        <div style={{ marginTop: 20, color: '#8E8E94' }}>Este dia no tiene ejercicios cargados.</div>
      </div>
    )
  }

  const logs = logged[ex.id] || []
  const done = logs.length >= ex.target_sets

  async function handleLog() {
    const { error: insertError } = await supabase.from('logged_sets').insert({
      planned_exercise_id: ex.id, client_id: session.user.id, set_number: logs.length + 1,
      actual_reps: Number(draft.reps), actual_weight_kg: Number(draft.weight)
    })
    if (insertError) { setError(insertError.message); return }
    await loadAll()
  }

  function goNext() {
    if (idx < exercises.length - 1) setIdx(idx + 1)
    else onBack()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#101012', color: '#F5F4F0', fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif", padding: 24, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: 'transparent', border: '1px solid #2A2A2F', color: '#C8C8CC', borderRadius: 100, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Salir</button>
        <div style={{ fontSize: 11, color: '#8E8E94', fontWeight: 700 }}>EJERCICIO {idx + 1} DE {exercises.length}</div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
        {exercises.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= idx ? '#CFFF5C' : '#2A2A2F' }} />
        ))}
      </div>

      {note && (
        <div style={{ background: '#171417', border: '1px solid #2A2320', borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 12, color: '#C8C8CC' }}>
          Tu entrenador: {note}
        </div>
      )}

      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 2 }}>{ex.name}</div>
      <div style={{ fontSize: 12, color: '#8E8E94', marginBottom: 14 }}>{dayLabel}</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <div style={{ background: '#1B1B1F', border: '1px solid #2A2A2F', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontWeight: 700 }}>{ex.target_sets} x {ex.target_reps}</div>
        {ex.target_weight_kg != null && <div style={{ background: '#1B1B1F', border: '1px solid #2A2A2F', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontWeight: 700 }}>{ex.target_weight_kg} kg</div>}
        <div style={{ background: '#1B1B1F', border: '1px solid #2A2A2F', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontWeight: 700 }}>RIR {ex.target_rir}</div>
      </div>
      <div style={{ fontSize: 11, color: '#8E8E94', marginBottom: 18 }}>Objetivo de tu entrenador</div>

      {error && <div style={{ fontSize: 13, color: '#FF6B7F', marginBottom: 10 }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {logs.map((l) => (
          <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#171A14', border: '1px solid #2A3324', borderRadius: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#CFFF5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#101012', fontWeight: 800 }}>OK</div>
            <div style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>Serie {l.set_number}</div>
            <div style={{ fontSize: 13, color: '#8AD16C', fontWeight: 700 }}>{l.actual_weight_kg} kg x {l.actual_reps}</div>
          </div>
        ))}

        {!done && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: '#1B1B1F', border: '1.5px solid #CFFF5C', borderRadius: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Serie {logs.length + 1}</div>
            <input style={{ ...input, marginLeft: 'auto' }} type="number" step="0.5" value={draft.weight} onChange={(e) => setDraft({ ...draft, weight: e.target.value })} />
            <span style={{ fontSize: 11, color: '#8E8E94' }}>kg x</span>
            <input style={input} type="number" value={draft.reps} onChange={(e) => setDraft({ ...draft, reps: e.target.value })} />
            <button onClick={handleLog} style={{ width: 26, height: 26, borderRadius: '50%', background: '#CFFF5C', border: 'none', fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>OK</button>
          </div>
        )}
      </div>

      {done && (
        <button onClick={goNext} style={{ background: '#CFFF5C', color: '#101012', border: 'none', borderRadius: 100, padding: 14, fontSize: 15, fontWeight: 800, width: '100%', cursor: 'pointer' }}>
          {idx < exercises.length - 1 ? 'Siguiente ejercicio' : 'Finalizar entrenamiento'}
        </button>
      )}
    </div>
  )
}
