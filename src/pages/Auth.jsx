import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const inputStyle = {
  background: '#1B1B1F',
  border: '1px solid #2A2A2F',
  borderRadius: 10,
  padding: '12px 14px',
  color: '#F5F4F0',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box'
}

export default function Auth() {
  const [mode, setMode] = useState('signin')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          role: 'trainer',
          full_name: fullName || email
        })
        if (profileError) {
          setError('Cuenta creada, pero hubo un problema guardando el perfil: ' + profileError.message)
          setLoading(false)
          return
        }
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#101012',
        color: '#F5F4F0',
        fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        boxSizing: 'border-box'
      }}
    >
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#CFFF5C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: '#101012'
            }}
          >
            R
          </div>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 20, fontWeight: 800 }}>
            ROAFIT
          </div>
        </div>

        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
          {mode === 'signin' ? 'Panel del entrenador' : 'Crea tu cuenta de entrenador'}
        </div>
        <div style={{ fontSize: 13, color: '#8E8E94', marginBottom: 24 }}>
          {mode === 'signin'
            ? 'Inicia sesion para ver tus clientes y programas.'
            : 'Solo la primera vez, luego inicias sesion normal.'}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Tu nombre"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={inputStyle}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
          <input
            type="password"
            placeholder="Contrasena"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
            minLength={6}
          />

          {error && (
            <div style={{ fontSize: 13, color: '#FF6B7F', lineHeight: 1.4 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#CFFF5C',
              color: '#101012',
              border: 'none',
              borderRadius: 100,
              padding: 14,
              fontSize: 15,
              fontWeight: 800,
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
              marginTop: 6
            }}
          >
            {loading ? 'Un momento...' : mode === 'signin' ? 'Iniciar sesion' : 'Crear cuenta'}
          </button>
        </form>

        <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: '#8E8E94' }}>
          {mode === 'signin' ? (
            <span>
              Primera vez?{' '}
              <button
                onClick={() => { setMode('signup'); setError('') }}
                style={{ background: 'none', border: 'none', color: '#CFFF5C', fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                Crea tu cuenta
              </button>
            </span>
          ) : (
            <span>
              Ya tienes cuenta?{' '}
              <button
                onClick={() => { setMode('signin'); setError('') }}
                style={{ background: 'none', border: 'none', color: '#CFFF5C', fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                Inicia sesion
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
