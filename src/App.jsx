import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Programs from './pages/Programs'
import ProgramEditor from './pages/ProgramEditor'

const loadingStyle = {
  minHeight: '100vh',
  background: '#101012',
  color: '#8E8E94',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'sans-serif',
  fontSize: 14
}

function ClientPlaceholder({ onSignOut }) {
  return (
    <div style={{ minHeight: '100vh', background: '#101012', color: '#F5F4F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: 24, textAlign: 'center', gap: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 800 }}>Cuenta creada correctamente</div>
      <div style={{ fontSize: 14, color: '#8E8E94', maxWidth: 340 }}>
        Tu entrenador ya puede verte en su panel. La app del cliente (tus entrenamientos, tu progreso) todavia esta en construccion.
      </div>
      <button onClick={onSignOut} style={{ background: 'transparent', border: '1px solid #2A2A2F', color: '#C8C8CC', borderRadius: 100, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
        Cerrar sesion
      </button>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined)
  const [role, setRole] = useState(undefined)
  const [trainerView, setTrainerView] = useState({ name: 'clients' })

  const params = new URLSearchParams(window.location.search)
  const inviteTrainerId = params.get('invite')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setRole(undefined)
      return
    }
    let cancelled = false
    supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setRole(data ? data.role : null)
      })
    return () => { cancelled = true }
  }, [session])

  if (session === undefined) return <div style={loadingStyle}>Cargando...</div>

  if (!session) return <Auth inviteTrainerId={inviteTrainerId} />

  if (role === undefined) return <div style={loadingStyle}>Cargando tu perfil...</div>

  if (role === 'trainer') {
    if (trainerView.name === 'programs') {
      return (
        <Programs
          session={session}
          onBack={() => setTrainerView({ name: 'clients' })}
          onOpenProgram={(id) => setTrainerView({ name: 'programEditor', programId: id })}
        />
      )
    }
    if (trainerView.name === 'programEditor') {
      return (
        <ProgramEditor
          session={session}
          programId={trainerView.programId}
          onBack={() => setTrainerView({ name: 'programs' })}
        />
      )
    }
    return <Dashboard session={session} onOpenPrograms={() => setTrainerView({ name: 'programs' })} />
  }

  if (role === 'client') return <ClientPlaceholder onSignOut={() => supabase.auth.signOut()} />

  return <div style={loadingStyle}>No se encontro tu perfil. Intenta cerrar sesion y volver a entrar.</div>
}
