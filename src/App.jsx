import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Programs from './pages/Programs'
import ProgramEditor from './pages/ProgramEditor'
import ClientDetail from './pages/ClientDetail'
import ClientHome from './pages/ClientHome'
import ClientWorkout from './pages/ClientWorkout'
import ClientProgress from './pages/ClientProgress'
import ClientIntake from './pages/ClientIntake'

const loadingStyle = { minHeight: '100vh', background: '#101012', color: '#8E8E94', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', fontSize: 14 }

export default function App() {
  const [session, setSession] = useState(undefined)
  const [role, setRole] = useState(undefined)
  const [intakeDone, setIntakeDone] = useState(undefined)
  const [trainerView, setTrainerView] = useState({ name: 'clients' })
  const [clientView, setClientView] = useState({ name: 'home' })

  const params = new URLSearchParams(window.location.search)
  const inviteTrainerId = params.get('invite')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setRole(undefined); return }
    let cancelled = false
    supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle().then(({ data }) => {
      if (!cancelled) setRole(data ? data.role : null)
    })
    return () => { cancelled = true }
  }, [session])

  useEffect(() => {
    if (role !== 'client' || !session) { setIntakeDone(undefined); return }
    let cancelled = false
    supabase.from('client_details').select('intake_completed').eq('id', session.user.id).maybeSingle().then(({ data }) => {
      if (!cancelled) setIntakeDone(data ? Boolean(data.intake_completed) : false)
    })
    return () => { cancelled = true }
  }, [role, session])

  if (session === undefined) return <div style={loadingStyle}>Cargando...</div>
  if (!session) return <Auth inviteTrainerId={inviteTrainerId} />
  if (role === undefined) return <div style={loadingStyle}>Cargando tu perfil...</div>

  if (role === 'trainer') {
    if (trainerView.name === 'programs') {
      return <Programs session={session} onBack={() => setTrainerView({ name: 'clients' })} onOpenProgram={(id) => setTrainerView({ name: 'programEditor', programId: id })} />
    }
    if (trainerView.name === 'programEditor') {
      return <ProgramEditor session={session} programId={trainerView.programId} onBack={() => setTrainerView(trainerView.fromClient ? { name: 'clientDetail', clientId: trainerView.fromClient } : { name: 'programs' })} />
    }
    if (trainerView.name === 'clientDetail') {
      return <ClientDetail session={session} clientId={trainerView.clientId} onBack={() => setTrainerView({ name: 'clients' })} onOpenProgram={(id) => setTrainerView({ name: 'programEditor', programId: id, fromClient: trainerView.clientId })} />
    }
    return <Dashboard session={session} onOpenPrograms={() => setTrainerView({ name: 'programs' })} onOpenClient={(id) => setTrainerView({ name: 'clientDetail', clientId: id })} />
  }

  if (role === 'client') {
    if (intakeDone === undefined) return <div style={loadingStyle}>Cargando...</div>
    if (intakeDone === false) return <ClientIntake session={session} onDone={() => setIntakeDone(true)} />
    if (clientView.name === 'workout') {
      return <ClientWorkout session={session} dayId={clientView.dayId} dayLabel={clientView.dayLabel} onBack={() => setClientView({ name: 'home' })} />
    }
    if (clientView.name === 'progress') {
      return <ClientProgress session={session} onBack={() => setClientView({ name: 'home' })} />
    }
    return <ClientHome session={session} onOpenDay={(dayId, dayLabel) => setClientView({ name: 'workout', dayId, dayLabel })} onOpenProgress={() => setClientView({ name: 'progress' })} />
  }

  return <div style={loadingStyle}>No se encontro tu perfil. Intenta cerrar sesion y volver a entrar.</div>
}
