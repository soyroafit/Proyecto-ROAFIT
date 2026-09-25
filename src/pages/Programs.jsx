import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const GOAL_TYPES = [
  'Adaptacion / Principiante',
  'Retorno a la actividad',
  'Hipertrofia',
  'Fuerza',
  'Perdida de grasa',
  'Recomposicion',
  'Funcional / Movilidad',
  'Resistencia',
  'Mantenimiento'
]

const inputStyle = {
  background: '#1B1B1F',
  border: '1px solid #2A2A2F',
  borderRadius: 10,
  padding: '10px 12px',
  color: '#F5F4F0',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box'
}
const labelStyle = { fontSize: 12, color: '#8E8E94', marginBottom: 4, display: 'block' }

export default function Programs({ session, onBack, onOpenProgram }) {
  const [programs, setPrograms] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [goalType, setGoalType] = useState(GOAL_TYPES[2])
  const [weeks, setWeeks] = useState(8)
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [clientId, setClientId] = useState('')

  async function loadAll() {
    setLoading(true)
    const [programsRes, clientsRes] = await Promise.all([
      supabase
        .from('programs')
        .select('id, name, goal_type, weeks, days_per_week, client_id, profiles(full_name)')
        .eq('trainer_id', session.user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('client_details')
        .select('id, profiles!client_details_id_fkey(full_name)')
        .eq('trainer_id', session.user.id)
    ])
    if (programsRes.error) setError(programsRes.error.message)
    else setPrograms(programsRes.data || [])
    if (!clientsRes.error) setClients(clientsRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
  }, [session.user.id])

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { data: program, error: createError } = await supabase
      .from('programs')
      .insert({
        trainer_id: session.user.id,
        client_id: clientId || null,
        name,
        goal_type: goalType,
        weeks: Number(weeks),
        days_per_week: Number(daysPerWeek)
      })
      .select()
      .single()

    if (createError) {
      setError(createError.message)
      setSaving(false)
      return
    }

    const dayRows = Array.from({ length: Number(daysPerWeek) }, (_, i) => ({
      program_id: program.id,
      day_number: i + 1,
      label: 'Dia ' + (i + 1),
      week_number: 1
    }))
    const { error: daysError } = await supabase.from('workout_days').insert(dayRows)
    if (daysError) {
      setError('Programa creado, pero hubo un problema generando los dias: ' + daysError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    onOpenProgram(program.id)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#101012', color: '#F5F4F0', fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif", padding: 24, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#CFFF5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#101012', fontSize: 14 }}>R</div>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 17, fontWeight: 800 }}>ROAFIT</div>
        </div>
        <button onClick={() => supabase.auth.signOut()} style={{ background: 'transparent', border: '1px solid #2A2A2F', color: '#C8C8CC', borderRadius: 100, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Cerrar sesion
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'transparent', color: '#C8C8CC', border: '1px solid #2A2A2F', borderRadius: 100, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Mis clientes
        </button>
        <div style={{ background: '#1B1B1F', color: '#F5F4F0', border: '1px solid #2A2A2F', borderRadius: 100, padding: '7px 16px', fontSize: 13, fontWeight: 700 }}>
          Programas
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: 24, fontWeight: 800 }}>Programas</div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ background: '#CFFF5C', color: '#101012', border: 'none', borderRadius: 100, padding: '10px 18px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
        >
          {showForm ? 'Cancelar' : '+ Crear programa'}
        </button>
      </div>
      <div style={{ fontSize: 13, color: '#8E8E94', marginBottom: 24 }}>
        {loading ? 'Cargando...' : programs.length + ' programa' + (programs.length === 1 ? '' : 's')}
      </div>

      {error && <div style={{ fontSize: 13, color: '#FF6B7F', marginBottom: 16 }}>{error}</div>}

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: '#1B1B1F', border: '1px solid #2A2A2F', borderRadius: 16, padding: 20, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Nombre del programa</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Hipertrofia - Bloque 1" required />
          </div>
          <div>
            <label style={labelStyle}>Objetivo</label>
            <select style={inputStyle} value={goalType} onChange={(e) => setGoalType(e.target.value)}>
              {GOAL_TYPES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Semanas</label>
              <input style={inputStyle} type="number" min="1" max="24" value={weeks} onChange={(e) => setWeeks(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Dias por semana</label>
              <input style={inputStyle} type="number" min="1" max="7" value={daysPerWeek} onChange={(e) => setDaysPerWeek(e.target.value)} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Asignar a cliente (opcional)</label>
            <select style={inputStyle} value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Sin asignar</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.profiles?.full_name || 'Sin nombre'}</option>)}
            </select>
          </div>
          <button type="submit" disabled={saving} style={{ background: '#CFFF5C', color: '#101012', border: 'none', borderRadius: 100, padding: 14, fontSize: 15, fontWeight: 800, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Creando...' : 'Crear y continuar'}
          </button>
        </form>
      )}

      {!loading && programs.length === 0 && !showForm && (
        <div style={{ background: '#1B1B1F', border: '1px dashed #2A2A2F', borderRadius: 16, padding: 32, textAlign: 'center', color: '#8E8E94', fontSize: 14 }}>
          Todavia no has creado ningun programa.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {programs.map((p) => (
          <div
            key={p.id}
            onClick={() => onOpenProgram(p.id)}
            style={{ background: '#1B1B1F', border: '1px solid #2A2A2F', borderRadius: 12, padding: 16, cursor: 'pointer' }}
          >
            <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: '#8E8E94', marginTop: 4 }}>
              {p.goal_type} - {p.weeks} semanas - {p.days_per_week} dias/semana - {p.profiles?.full_name || 'Sin asignar'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
