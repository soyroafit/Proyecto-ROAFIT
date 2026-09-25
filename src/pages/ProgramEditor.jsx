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
  width: '100%'
}
const fieldLabelStyle = { fontSize: 11, color: '#8E8E94', marginBottom: 4, display: 'block' }
const CUSTOM = '__custom__'

export default function ProgramEditor({ session, programId, onBack }) {
  const [program, setProgram] = useState(null)
  const [days, setDays] = useState([])
  const [activeDayId, setActiveDayId] = useState(null)
  const [exercises, setExercises] = useState([])
  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [muscleGroup, setMuscleGroup] = useState('')
  const [exChoice, setExChoice] = useState('')
  const [customName, setCustomName] = useState('')
  const [exSets, setExSets] = useState(4)
  const [exReps, setExReps] = useState(8)
  const [exWeight, setExWeight] = useState('')
  const [exRir, setExRir] = useState(2)

  async function loadProgram() {
    setLoading(true)
    const [programRes, daysRes, catalogRes] = await Promise.all([
      supabase.from('programs').select('id, name, goal_type, weeks, days_per_week').eq('id', programId).single(),
      supabase.from('workout_days').select('id, day_number, label').eq('program_id', programId).order('day_number'),
      supabase.from('exercise_catalog').select('id, name, muscle_group').order('muscle_group').order('name')
    ])
    if (programRes.error) setError(programRes.error.message)
    else setProgram(programRes.data)
    if (!daysRes.error) {
      setDays(daysRes.data || [])
      if (daysRes.data && daysRes.data.length > 0 && !activeDayId) {
        setActiveDayId(daysRes.data[0].id)
      }
    }
    if (!catalogRes.error) {
      setCatalog(catalogRes.data || [])
      if (catalogRes.data && catalogRes.data.length > 0) {
        setMuscleGroup(catalogRes.data[0].muscle_group)
      }
    }
    setLoading(false)
  }

  async function loadExercises(dayId) {
    if (!dayId) return
    const { data, error: exError } = await supabase
      .from('planned_exercises')
      .select('id, name, target_sets, target_reps, target_weight_kg, target_rir, order_index')
      .eq('workout_day_id', dayId)
      .order('order_index')
    if (!exError) setExercises(data || [])
  }

  useEffect(() => { loadProgram() }, [programId])
  useEffect(() => { loadExercises(activeDayId) }, [activeDayId])

  const muscleGroups = [...new Set(catalog.map((c) => c.muscle_group))]
  const exercisesForGroup = catalog.filter((c) => c.muscle_group === muscleGroup)

  useEffect(() => {
    if (exercisesForGroup.length > 0) setExChoice(exercisesForGroup[0].name)
    else setExChoice(CUSTOM)
  }, [muscleGroup, catalog.length])

  async function handleAddExercise(e) {
    e.preventDefault()
    if (!activeDayId) return
    const finalName = exChoice === CUSTOM ? customName : exChoice
    if (!finalName) return
    const { error: insertError } = await supabase.from('planned_exercises').insert({
      workout_day_id: activeDayId,
      name: finalName,
      target_sets: Number(exSets),
      target_reps: Number(exReps),
      target_weight_kg: exWeight === '' ? null : Number(exWeight),
      target_rir: Number(exRir),
      order_index: exercises.length
    })
    if (insertError) {
      setError(insertError.message)
      return
    }
    setCustomName('')
    loadExercises(activeDayId)
  }

  async function handleDeleteExercise(id) {
    await supabase.from('planned_exercises').delete().eq('id', id)
    loadExercises(activeDayId)
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', background: '#101012', color: '#8E8E94', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>Cargando...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#101012', color: '#F5F4F0', fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif", padding: 24, boxSizing: 'border-box' }}>
      <button onClick={onBack} style={{ background: 'transparent', border: '1px solid #2A2A2F', color: '#C8C8CC', borderRadius: 100, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 20 }}>
        Volver a programas
      </button>

      {error && <div style={{ fontSize: 13, color: '#FF6B7F', marginBottom: 16 }}>{error}</div>}

      {program && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{program.name}</div>
          <div style={{ fontSize: 13, color: '#8E8E94', marginTop: 4 }}>
            {program.goal_type} - {program.weeks} semanas - {program.days_per_week} dias/semana
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {days.map((d) => (
          <button
            key={d.id}
            onClick={() => setActiveDayId(d.id)}
            style={{
              background: activeDayId === d.id ? '#CFFF5C' : '#1B1B1F',
              color: activeDayId === d.id ? '#101012' : '#C8C8CC',
              border: activeDayId === d.id ? 'none' : '1px solid #2A2A2F',
              borderRadius: 100,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {exercises.length === 0 && (
          <div style={{ background: '#1B1B1F', border: '1px dashed #2A2A2F', borderRadius: 12, padding: 20, textAlign: 'center', color: '#8E8E94', fontSize: 13 }}>
            Sin ejercicios todavia en este dia.
          </div>
        )}
        {exercises.map((ex) => (
          <div key={ex.id} style={{ background: '#1B1B1F', border: '1px solid #2A2A2F', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{ex.name}</div>
              <div style={{ fontSize: 12, color: '#8E8E94', marginTop: 2 }}>
                {ex.target_sets} series x {ex.target_reps} reps{ex.target_weight_kg ? ' - ' + ex.target_weight_kg + ' kg' : ''} - RIR {ex.target_rir}
              </div>
            </div>
            <button onClick={() => handleDeleteExercise(ex.id)} style={{ background: 'transparent', border: 'none', color: '#FF6B7F', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Eliminar
            </button>
          </div>
        ))}
      </div>

      {activeDayId && (
        <form onSubmit={handleAddExercise} style={{ background: '#1B1B1F', border: '1px solid #2A2A2F', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Anadir ejercicio</div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={fieldLabelStyle}>Grupo muscular</label>
              <select style={inputStyle} value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)}>
                {muscleGroups.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={fieldLabelStyle}>Ejercicio</label>
              <select style={inputStyle} value={exChoice} onChange={(e) => setExChoice(e.target.value)}>
                {exercisesForGroup.map((ex) => <option key={ex.id} value={ex.name}>{ex.name}</option>)}
                <option value={CUSTOM}>Otro (escribir)</option>
              </select>
            </div>
          </div>

          {exChoice === CUSTOM && (
            <div>
              <label style={fieldLabelStyle}>Nombre del ejercicio</label>
              <input style={inputStyle} placeholder="Ej: Press banca" value={customName} onChange={(e) => setCustomName(e.target.value)} required />
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={fieldLabelStyle}>Series</label>
              <input style={inputStyle} type="number" min="1" value={exSets} onChange={(e) => setExSets(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={fieldLabelStyle}>Repeticiones</label>
              <input style={inputStyle} type="number" min="1" value={exReps} onChange={(e) => setExReps(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={fieldLabelStyle}>Peso (kg)</label>
              <input style={inputStyle} type="number" min="0" step="0.5" placeholder="Opcional" value={exWeight} onChange={(e) => setExWeight(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={fieldLabelStyle}>RIR</label>
              <input style={inputStyle} type="number" min="0" value={exRir} onChange={(e) => setExRir(e.target.value)} />
            </div>
          </div>
          <button type="submit" style={{ background: '#CFFF5C', color: '#101012', border: 'none', borderRadius: 100, padding: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer', marginTop: 4 }}>
            + Anadir ejercicio
          </button>
        </form>
      )}
    </div>
  )
}
