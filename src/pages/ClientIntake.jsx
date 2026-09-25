import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const input = { background: '#1B1B1F', border: '1px solid #2A2A2F', borderRadius: 10, padding: '11px 13px', color: '#F5F4F0', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }
const label = { fontSize: 12, color: '#8E8E94', marginBottom: 4, display: 'block' }
const DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']
const EQUIP = ['Barra', 'Mancuernas', 'Maquinas', 'Poleas', 'Rack', 'Banco', 'Kettlebells', 'Bandas elasticas', 'Cinta', 'Bicicleta', 'Remo', 'Otro']

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#CFFF5C', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  )
}

function Field({ children, l }) {
  return <div><label style={label}>{l}</label>{children}</div>
}

function Chips({ options, selected, onToggle }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const active = selected.includes(o)
        return (
          <div key={o} onClick={() => onToggle(o)} style={{ padding: '7px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: active ? '#CFFF5C' : '#1B1B1F', color: active ? '#101012' : '#C8C8CC', border: '1px solid ' + (active ? '#CFFF5C' : '#2A2A2F') }}>
            {o}
          </div>
        )
      })}
    </div>
  )
}

export default function ClientIntake({ session, onDone }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [f, setF] = useState({
    lastName: '', birthDate: '', phone: '', weight: '', height: '',
    primaryGoal: '', priority: '', trainingLevel: '', trainingExperience: '', currentFrequency: '',
    availableDays: [], sessionsPerWeek: '', sessionDuration: '', trainingEnvironment: '', equipment: [],
    workType: '', dailyActivity: '', hasHealthIssue: '', healthIssueNotes: ''
  })

  function set(key, value) { setF((prev) => ({ ...prev, [key]: value })) }
  function toggleArr(key, value) {
    setF((prev) => ({ ...prev, [key]: prev[key].includes(value) ? prev[key].filter((v) => v !== value) : [...prev[key], value] }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error: updateError } = await supabase.from('client_details').update({
      last_name: f.lastName || null,
      birth_date: f.birthDate || null,
      phone: f.phone || null,
      weight_kg: f.weight ? Number(f.weight) : null,
      height_cm: f.height ? Number(f.height) : null,
      primary_goal: f.primaryGoal || null,
      priority: f.priority || null,
      training_level: f.trainingLevel || null,
      training_experience: f.trainingExperience || null,
      current_frequency: f.currentFrequency || null,
      available_days: f.availableDays,
      sessions_per_week: f.sessionsPerWeek || null,
      session_duration: f.sessionDuration || null,
      training_environment: f.trainingEnvironment || null,
      equipment: f.equipment,
      work_type: f.workType || null,
      daily_activity: f.dailyActivity || null,
      has_health_issue: f.hasHealthIssue === 'si',
      health_issue_notes: f.hasHealthIssue === 'si' ? f.healthIssueNotes : null,
      intake_completed: true
    }).eq('id', session.user.id)
    setSaving(false)
    if (updateError) { setError(updateError.message); return }
    onDone()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#101012', color: '#F5F4F0', fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif", padding: 24, boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#CFFF5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#101012', fontSize: 14 }}>R</div>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 17, fontWeight: 800 }}>ROAFIT</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Ficha inicial del cliente</div>
        <div style={{ fontSize: 13, color: '#8E8E94', marginBottom: 24 }}>Unos 3-5 minutos. Esto ayuda a tu entrenador a personalizar tu programa desde el primer dia.</div>

        <form onSubmit={handleSubmit}>
          <Section title="Datos personales">
            <Field l="Apellidos"><input style={input} value={f.lastName} onChange={(e) => set('lastName', e.target.value)} /></Field>
            <Field l="Fecha de nacimiento"><input style={input} type="date" value={f.birthDate} onChange={(e) => set('birthDate', e.target.value)} /></Field>
            <Field l="Telefono"><input style={input} value={f.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          </Section>

          <Section title="Datos fisicos">
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}><Field l="Peso (kg)"><input style={input} type="number" step="0.1" value={f.weight} onChange={(e) => set('weight', e.target.value)} /></Field></div>
              <div style={{ flex: 1 }}><Field l="Altura (cm)"><input style={input} type="number" value={f.height} onChange={(e) => set('height', e.target.value)} /></Field></div>
            </div>
          </Section>

          <Section title="Objetivo">
            <Field l="Objetivo principal">
              <select style={input} value={f.primaryGoal} onChange={(e) => set('primaryGoal', e.target.value)}>
                <option value="">Selecciona</option>
                <option>Ganar masa muscular</option><option>Perder grasa</option><option>Recomposicion corporal</option>
                <option>Ganar fuerza</option><option>Mejorar condicion fisica</option><option>Mejorar rendimiento deportivo</option>
                <option>Volver a entrenar</option><option>Mantenerse activo</option><option>Otro</option>
              </select>
            </Field>
            <Field l="Que es lo mas importante para ti ahora?"><input style={input} value={f.priority} onChange={(e) => set('priority', e.target.value)} /></Field>
          </Section>

          <Section title="Experiencia de entrenamiento">
            <Field l="Nivel actual">
              <select style={input} value={f.trainingLevel} onChange={(e) => set('trainingLevel', e.target.value)}>
                <option value="">Selecciona</option><option>Principiante</option><option>Intermedio</option><option>Avanzado</option>
              </select>
            </Field>
            <Field l="Cuanto tiempo llevas entrenando?">
              <select style={input} value={f.trainingExperience} onChange={(e) => set('trainingExperience', e.target.value)}>
                <option value="">Selecciona</option><option>Nunca</option><option>Menos de 6 meses</option>
                <option>6-12 meses</option><option>1-3 anos</option><option>Mas de 3 anos</option>
              </select>
            </Field>
            <Field l="Cuantos dias entrenas actualmente?">
              <select style={input} value={f.currentFrequency} onChange={(e) => set('currentFrequency', e.target.value)}>
                <option value="">Selecciona</option><option>0</option><option>1-2</option><option>3</option><option>4</option><option>5+</option>
              </select>
            </Field>
          </Section>

          <Section title="Disponibilidad">
            <Field l="Dias disponibles"><Chips options={DAYS} selected={f.availableDays} onToggle={(v) => toggleArr('availableDays', v)} /></Field>
            <Field l="Sesiones posibles por semana">
              <select style={input} value={f.sessionsPerWeek} onChange={(e) => set('sessionsPerWeek', e.target.value)}>
                <option value="">Selecciona</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5+</option>
              </select>
            </Field>
            <Field l="Tiempo disponible por sesion">
              <select style={input} value={f.sessionDuration} onChange={(e) => set('sessionDuration', e.target.value)}>
                <option value="">Selecciona</option><option>Menos de 30 min</option><option>30-45 min</option>
                <option>45-60 min</option><option>60-90 min</option><option>Mas de 90 min</option>
              </select>
            </Field>
          </Section>

          <Section title="Entorno y equipamiento">
            <Field l="Donde entrenas?">
              <select style={input} value={f.trainingEnvironment} onChange={(e) => set('trainingEnvironment', e.target.value)}>
                <option value="">Selecciona</option><option>Gimnasio</option><option>Casa</option><option>Exterior</option><option>Mixto</option>
              </select>
            </Field>
            <Field l="Equipamiento disponible"><Chips options={EQUIP} selected={f.equipment} onToggle={(v) => toggleArr('equipment', v)} /></Field>
          </Section>

          <Section title="Actividad diaria">
            <Field l="Tipo de trabajo">
              <select style={input} value={f.workType} onChange={(e) => set('workType', e.target.value)}>
                <option value="">Selecciona</option><option>Principalmente sentado</option><option>De pie</option>
                <option>Trabajo fisico</option><option>Trabajo muy fisico</option><option>Variable</option>
              </select>
            </Field>
            <Field l="Actividad fuera del entrenamiento">
              <select style={input} value={f.dailyActivity} onChange={(e) => set('dailyActivity', e.target.value)}>
                <option value="">Selecciona</option><option>Baja</option><option>Moderada</option><option>Alta</option>
              </select>
            </Field>
          </Section>

          <Section title="Salud y limitaciones">
            <Field l="Tienes algun problema de salud que tu entrenador deba conocer?">
              <select style={input} value={f.hasHealthIssue} onChange={(e) => set('hasHealthIssue', e.target.value)}>
                <option value="">Selecciona</option><option value="no">No</option><option value="si">Si</option>
              </select>
            </Field>
            {f.hasHealthIssue === 'si' && (
              <Field l="Especifica"><textarea style={{ ...input, minHeight: 70, resize: 'vertical' }} value={f.healthIssueNotes} onChange={(e) => set('healthIssueNotes', e.target.value)} /></Field>
            )}
          </Section>

          {error && <div style={{ fontSize: 13, color: '#FF6B7F', marginBottom: 14 }}>{error}</div>}

          <button type="submit" disabled={saving} style={{ background: '#CFFF5C', color: '#101012', border: 'none', borderRadius: 100, padding: 14, fontSize: 15, fontWeight: 800, width: '100%', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Guardando...' : 'Enviar ficha'}
          </button>
        </form>
      </div>
    </div>
  )
}
