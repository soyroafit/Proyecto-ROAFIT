import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const ALL_DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']
const SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export default function ClientHome({ session, onOpenDay, onOpenProgress }) {
  const [profile, setProfile] = useState(null)
  const [client, setClient] = useState(null)
  const [program, setProgram] = useState(null)
  const [days, setDays] = useState([])
  const [exerciseCounts, setExerciseCounts] = useState({})
  const [doneDayIds, setDoneDayIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [profRes, clientRes, progRes] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', session.user.id).maybeSingle(),
        supabase.from('client_details').select('goal, weight_kg, height_cm, available_days').eq('id', session.user.id).maybeSingle(),
        supabase.from('programs').select('id, name, goal_type, days_per_week').eq('client_id', session.user.id).order('created_at', { ascending: false }).limit(1)
      ])
      setProfile(profRes.data)
      setClient(clientRes.data)

      if (!progRes.data || progRes.data.length === 0) { setProgram(null); setLoading(false); return }
      const p = progRes.data[0]
      setProgram(p)

      const { data: dayRows } = await supabase.from('workout_days').select('id, day_number, label').eq('program_id', p.id).order('day_number')
      setDays(dayRows || [])

      const dayIds = (dayRows || []).map((d) => d.id)
      if (dayIds.length) {
        const { data: exRows } = await supabase.from('planned_exercises').select('id, workout_day_id').in('workout_day_id', dayIds)
        const counts = {}
        const exToDay = {}
        for (const e of exRows || []) {
          counts[e.workout_day_id] = (counts[e.workout_day_id] || 0) + 1
          exToDay[e.id] = e.workout_day_id
        }
        setExerciseCounts(counts)

        const exIds = Object.keys(exToDay)
        if (exIds.length) {
          const monday = new Date()
          monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
          monday.setHours(0, 0, 0, 0)
          const { data: logs } = await supabase.from('logged_sets').select('planned_exercise_id').eq('client_id', session.user.id).in('planned_exercise_id', exIds).gte('logged_at', monday.toISOString())
          const done = new Set()
          for (const l of logs || []) { if (exToDay[l.planned_exercise_id]) done.add(exToDay[l.planned_exercise_id]) }
          setDoneDayIds(done)
        }
      }
      setLoading(false)
    }
    load()
  }, [session.user.id])

  if (loading) return <div style={{ minHeight: '100vh', background: '#101012', color: '#8E8E94', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>Cargando...</div>

  const availableDays = client?.available_days || []
  const dayMap = {}
  if (availableDays.length && days.length) {
    const ordered = ALL_DAYS.filter((d) => availableDays.includes(d))
    days.forEach((d, i) => { if (ordered[i]) dayMap[ordered[i]] = d })
  }
  const todayName = ALL_DAYS[(new Date().getDay() + 6) % 7]
  const todayWorkoutDay = dayMap[todayName]

  return (
    <div style={{ minHeight: '100vh', background: '#101012', color: '#F5F4F0', fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif", padding: 24, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#CFFF5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#101012', fontSize: 14 }}>R</div>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 17, fontWeight: 800 }}>ROAFIT</div>
        </div>
        <button onClick={() => supabase.auth.signOut()} style={{ background: 'transparent', border: '1px solid #2A2A2F', color: '#C8C8CC', borderRadius: 100, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cerrar sesion</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <div style={{ background: '#1B1B1F', color: '#F5F4F0', border: '1px solid #2A2A2F', borderRadius: 100, padding: '7px 16px', fontSize: 13, fontWeight: 700 }}>Hoy</div>
        <button onClick={onOpenProgress} style={{ background: 'transparent', color: '#C8C8CC', border: '1px solid #2A2A2F', borderRadius: 100, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Progreso</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#1B1B1F', border: '1px solid #2A2A2F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>
          {(profile?.full_name || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{profile?.full_name || 'Sin nombre'}</div>
          <div style={{ fontSize: 12, color: '#8E8E94' }}>Objetivo: {client?.goal || 'Aun sin definir'}</div>
        </div>
      </div>

      {(client?.weight_kg || client?.height_cm) && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {client.weight_kg && <div style={{ background: '#1B1B1F', border: '1px solid #2A2A2F', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700 }}>{client.weight_kg} kg</div>}
          {client.height_cm && <div style={{ background: '#1B1B1F', border: '1px solid #2A2A2F', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700 }}>{client.height_cm} cm</div>}
        </div>
      )}

      {!program && (
        <div style={{ background: '#1B1B1F', border: '1px dashed #2A2A2F', borderRadius: 16, padding: 32, textAlign: 'center', color: '#8E8E94', fontSize: 14 }}>
          Tu entrenador todavia no te ha asignado ningun programa. Vuelve pronto.
        </div>
      )}

      {program && (
        <>
          <div style={{ fontSize: 12, color: '#8E8E94', marginBottom: 6 }}>{program.days_per_week} dias/semana - {program.name}</div>

          {availableDays.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {ALL_DAYS.map((d, i) => {
                const wd = dayMap[d]
                const isToday = d === todayName
                const isDone = wd && doneDayIds.has(wd.id)
                let bg = '#1B1B1F', color = '#4A4A4E', border = '#2A2A2F'
                if (isDone) { bg = '#CFFF5C'; color = '#101012'; border = '#CFFF5C' }
                else if (isToday && wd) { bg = '#171A24'; color = '#7FB8F0'; border = '#7FB8F0' }
                else if (wd) { color = '#8E8E94' }
                return (
                  <div key={d} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#8E8E94', marginBottom: 4 }}>{SHORT[i]}</div>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: bg, border: '1px solid ' + border, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, margin: '0 auto' }}>
                      {isDone ? '✓' : isToday ? '●' : wd ? '○' : '-'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {todayWorkoutDay ? (
            <div style={{ background: '#171A24', border: '1px solid #2A3244', borderRadius: 16, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#7FB8F0', fontWeight: 700, marginBottom: 6 }}>ENTRENAMIENTO DE HOY</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{todayWorkoutDay.label}</div>
              <div style={{ fontSize: 12, color: '#8E8E94', marginBottom: 16 }}>{exerciseCounts[todayWorkoutDay.id] || 0} ejercicios - ~{Math.round((exerciseCounts[todayWorkoutDay.id] || 0) * 8)} min</div>
              <button onClick={() => onOpenDay(todayWorkoutDay.id, todayWorkoutDay.label)} style={{ background: '#CFFF5C', color: '#101012', border: 'none', borderRadius: 100, padding: 14, fontSize: 14, fontWeight: 800, width: '100%', cursor: 'pointer' }}>
                Empezar entrenamiento
              </button>
            </div>
          ) : (
            <div style={{ background: '#1B1B1F', border: '1px dashed #2A2A2F', borderRadius: 16, padding: 20, textAlign: 'center', color: '#8E8E94', fontSize: 13, marginBottom: 20 }}>
              Hoy no tienes entrenamiento programado.
            </div>
          )}

          <div style={{ fontSize: 13, color: '#8E8E94', marginBottom: 8 }}>Todos los dias</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {days.map((d) => (
              <div key={d.id} onClick={() => onOpenDay(d.id, d.label)} style={{ background: '#1B1B1F', border: '1px solid #2A2A2F', borderRadius: 12, padding: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{d.label}</div>
                <div style={{ color: '#CFFF5C', fontSize: 13, fontWeight: 700 }}>Entrenar &gt;</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
