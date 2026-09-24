import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'

export default function App() {
    const [session, setSession] = useState(undefined)

  useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session))
        const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
                setSession(newSession)
        })
        return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) return <div style={{ minHeight: '100vh', background: '#101012', color: '#8E8E94', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', fontSize: 14 }}>Cargando...</div>

      return session ? <Dashboard session={session} /> : <Auth />
}
