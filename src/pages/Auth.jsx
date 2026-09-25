import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const plainInputStyle = { background: '#1B1B1F', border: '1px solid #2A2A2F', borderRadius: 10, padding: '12px 14px', color: '#F5F4F0', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }
const inputStyle = { ...plainInputStyle, padding: '12px 44px 12px 14px' }

function EntryCard({ color, bg, label, title, desc, onClick }) {
  return (
    <div onClick={onClick} style={{ background: bg, border: '1px solid ' + color + '55', borderRadius: 14, padding: 16, cursor: 'pointer', marginBottom: 12 }}>
      <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 800, background: color + '22', color: color, marginBottom: 8 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#8E8E94' }}>{desc}</div>
    </div>
  )
}

export default function Auth({ inviteTrainerId }) {
  const isClientInvite = Boolean(inviteTrainerId)
  const [entry, setEntry] = useState(isClientInvite ? 'client' : null)
  const [mode, setMode] = useState(isClientInvite ? 'signup' : 'signin')
  const [fullName, setFullName] = useState('')
  const [gender, setGender] = useState('')
  const [intakeGoal, setIntakeGoal] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'signup') {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role: isClientInvite ? 'client' : 'trainer' } }
      })
      if (signUpError) { setError(signUpError.message); setLoading(false); return }
      if (isClientInvite) {
        const { error: linkError } = await supabase.rpc('accept_client_invite', {
          p_trainer_id: inviteTrainerId, p_gender: gender, p_client_goal_note: intakeGoal
        })
        if (linkError) { setError('Cuenta creada, pero no se pudo vincular con tu entrenador: ' + linkError.message); setLoading(false); return }
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) { setError(signInError.message); setLoading(false); return }
    }
    setLoading(false)
  }

  const accentColor = entry === 'client' ? '#7FB8F0' : '#E8B84C'

  return (
    <div style={{ minHeight: '100vh', background: '#101012', color: '#F5F4F0', fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#CFFF5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#101012' }}>R</div>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 20, fontWeight: 800 }}>ROAFIT</div>
        </div>

        {entry === null && (
          <>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Quien eres?</div>
            <div style={{ fontSize: 13, color: '#8E8E94', marginBottom: 20 }}>La misma app, dos experiencias distintas segun tu rol.</div>
            <EntryCard color="#7FB8F0" bg="#141A26" label="CLIENTE" title="Soy cliente de un entrenador" desc="Sigo un programa asignado y registro mis entrenamientos." onClick={() => { setEntry('client'); setMode('signin') }} />
            <EntryCard color="#E8B84C" bg="#1E1A0F" label="ENTRENADOR" title="Soy entrenador" desc="Creo programas y hago seguimiento a mis clientes." onClick={() => { setEntry('trainer'); setMode('signin') }} />
          </>
        )}

        {entry !== null && (
          <>
            {!isClientInvite && (
              <button type="button" onClick={() => { setEntry(null); setError('') }} style={{ background: 'none', border: 'none', color: '#8E8E94', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: 16 }}>
                &lt; Cambiar
              </button>
            )}

            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
              {isClientInvite ? 'Unete como cliente' : entry === 'client' ? 'Portal del cliente' : mode === 'signin' ? 'Panel del entrenador' : 'Crea tu cuenta de entrenador'}
            </div>
            <div style={{ fontSize: 13, color: '#8E8E94', marginBottom: 24 }}>
              {isClientInvite ? 'Tu entrenador te invito a ROAFIT. Cuentanos un poco de ti para empezar.'
                : entry === 'client' ? 'Inicia sesion para ver tu programa y registrar tus series.'
                : mode === 'signin' ? 'Inicia sesion para ver tus clientes y programas.' : 'Solo la primera vez, luego inicias sesion normal.'}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {mode === 'signup' && (
                <input type="text" placeholder="Tu nombre" value={fullName} onChange={(e) => setFullName(e.target.value)} style={plainInputStyle} required />
              )}
              {isClientInvite && (
                <select value={gender} onChange={(e) => setGender(e.target.value)} style={plainInputStyle} required>
                  <option value="" disabled>Sexo</option>
                  <option value="Hombre">Hombre</option>
                  <option value="Mujer">Mujer</option>
                  <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                </select>
              )}
              {isClientInvite && (
                <textarea placeholder="Que quieres conseguir con el entrenamiento?" value={intakeGoal} onChange={(e) => setIntakeGoal(e.target.value)} style={{ ...plainInputStyle, minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }} />
              )}
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={plainInputStyle} required />
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} placeholder="Contrasena" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8E8E94', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '6px 8px' }}>
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {error && <div style={{ fontSize: 13, color: '#FF6B7F', lineHeight: 1.4 }}>{error}</div>}
              <button type="submit" disabled={loading} style={{ background: accentColor, color: '#101012', border: 'none', borderRadius: 100, padding: 14, fontSize: 15, fontWeight: 800, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1, marginTop: 6 }}>
                {loading ? 'Un momento...' : mode === 'signin' ? 'Iniciar sesion' : isClientInvite ? 'Crear mi cuenta' : 'Crear cuenta'}
              </button>
            </form>

            {!isClientInvite && entry === 'trainer' && (
              <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: '#8E8E94' }}>
                {mode === 'signin' ? (
                  <span>Primera vez?{' '}<button onClick={() => { setMode('signup'); setError('') }} style={{ background: 'none', border: 'none', color: '#CFFF5C', fontWeight: 700, cursor: 'pointer', padding: 0 }}>Crea tu cuenta</button></span>
                ) : (
                  <span>Ya tienes cuenta?{' '}<button onClick={() => { setMode('signin'); setError('') }} style={{ background: 'none', border: 'none', color: '#CFFF5C', fontWeight: 700, cursor: 'pointer', padding: 0 }}>Inicia sesion</button></span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
