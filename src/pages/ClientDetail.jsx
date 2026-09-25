import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const inputStyle = {
  background: '#1B1B1F',
  border: '1px solid #2A2A2F',
  borderRadius: 10,
  padding: '10px 12px',
  color: '#F5F4F0',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit'
}
const labelStyle = { fontSize: 12, color: '#8E8E94', marginBottom: 4, display: 'block' }
const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'pending', label: 'Pendiente' }
]

export default function ClientDetail({ session, clientId, onBack, onOpenProgram }) {
  const [client, setClient] = useState(null)
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [goal, setGoal] = useState('')
  const [status, setStatus] = useState('pending')
  const [pathologies, setPathologies] = useState('')
  const [trainerNotes, setTrainerNotes] = useState('')

  async function loadClient() {
    setLoading(true)
    const [clientRes, programsRes] = await Promise.all([
      supabase.from('client_details').select('id, goal, status, pathologies, trainer_notes, profiles!client_details_id_fkey(full_name)').eq('id', clientId).single(),
      supabase.from('programs').select('id, name, goal_type, weeks, days_per_week').eq('client_id', clientId).order('created_at', { ascending: false })
    ])
    if (clientRes.error) {
      setError(clientRes.error.message)
    } else if (clientRes.data) {
      setClient(clientRes.data)
      setGoal(clientRes.data.goal || '')
      setStatus(clientRes.data.status || 'pending')
      setPathologies(clientRes.data.pathologies || '')
      setTrainerNotes(clientRes.data.trainer_notes || '')
    }
    if (!programsRes.error) setPrograms(programsRes.data || [])
    setLoading(false)
  }

  useEffect(() => { loadClient() }, [clientId])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error: updateError } = await supabase
      .from('client_details')
      .update({ goal, status, pathologies, trainer_notes: trainerNotes })
      .eq('id', clientId)
    setSaving(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', background: '#101012', color: '#8E8E94', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>Cargando...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#101012', color: '#F5F4F0', fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif", padding: 24, boxSizing: 'border-box' }}>
      <button onClick={onBack} style={{ background: 'transparent', border: '1px solid #2A2A2F', color: '#C8C8CC', borderRadius: 100, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 20 }}>
        Volver a mis clientes
      </button>

      {error && <div style={{ fontSize: 13, color: '#FF6B7F', marginBottom: 16 }}>{error}</div>}

      {client && (
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>
          {client.profiles?.full_name || 'Sin nombre'}
        </div>
      )}

      <form onSubmit={handleSave} style={{ background: '#1B1B1F', border: '1px solid #2A2A2F', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Ficha del cliente</div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 2 }}>
            <label style={labelStyle}>Objetivo</label>
            <input style={inputStyle} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Ej: Perdida de grasa" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Estado</label>
            <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Patologias y limitaciones</label>
          <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={pathologies} onChange={(e) => setPathologies(e.target.value)} placeholder="Ej: Molestia cronica de hombro derecho. Evitar press por encima de la cabeza con carga alta." />
        </div>

        <div>
          <label style={labelStyle}>Notas del entrenador</label>
          <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={trainerNotes} onChange={(e) => setTrainerNotes(e.target.value)} placeholder="Notas privadas sobre el progreso o el seguimiento" />
        </div>

        <button type="submit" disabled={saving} style={{ background: '#CFFF5C', color: '#101012', border: 'none', borderRadius: 100, padding: 12, fontSize: 14, fontWeight: 800, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>Programas asignados</div>
      </div>

      {programs.length === 0 && (
        <div style={{ background: '#1B1B1F', border: '1px dashed #2A2A2F', borderRadius: 12, padding: 20, textAlign: 'center', color: '#8E8E94', fontSize: 13 }}>
          Este cliente todavia no tiene ningun programa asignado.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {programs.map((p) => (
          <div
            key={p.id}
            onClick={() => onOpenProgram(p.id)}
            style={{ background: '#1B1B1F', border: '1px solid #2A2A2F', borderRadius: 12, padding: 14, cursor: 'pointer' }}
          >
            <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: '#8E8E94', marginTop: 2 }}>
              {p.goal_type} - {p.weeks} semanas - {p.days_per_week} dias/semana
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
