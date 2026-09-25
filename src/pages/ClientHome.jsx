import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ClientHome({ session, onOpenDay, onOpenProgress }) {
  const [program, setProgram] = useState(null)
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: programs, error: programError } = await supabase
        .from('programs')
        .select('id, name, goal_type, weeks, days_per_week')
        .eq('client_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (programError) { setError(programError.message); setLoading(false); return }
      if (!programs || programs.length === 0) { setProgram(null); setLoading(false); return }

      const currentProgram = programs[0]
      setProgram(currentProgram)

      const { data: dayRows, error: daysError } = await supabase
        .from('workout_days')
        .select('id, day_number, label')
        .eq('program_id', currentProgram.id)
        .order('day_number')

      if (!daysError) setDays(dayRows || [])
      setLoading(false)
    }
    load()
  }, [session.user.id])

  if (loading) return <div style={{ minHeight: '100vh', background: '#101012', color: '#8E8E94', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>Cargando...</div>

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

      {error && <div style={{ fontSize: 13, color: '#FF6B7F', marginBottom: 16 }}>{error}</div>}

      {!program && !error && (
        <div style={{ background: '#1B1B1F', border: '1px dashed #2A2A2F', borderRadius: 16, padding: 32, textAlign: 'center', color: '#8E8E94', fontSize: 14 }}>
          Tu entrenador todavia no te ha asignado ningun programa. Vuelve pronto.
        </div>
      )}

      {program && (
        <>
          <div style={{ fontSize: 13, color: '#8E8E94', marginBottom: 4 }}>Tu programa</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{program.name}</div>
          <div style={{ fontSize: 13, color: '#8E8E94', marginBottom: 24 }}>
            {program.goal_type} - {program.weeks} semanas - {program.days_per_week} dias/semana
          </div>

          <div style={{ fontSize: 13, color: '#8E8E94', marginBottom: 8 }}>Elige un dia para entrenar</div>
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
