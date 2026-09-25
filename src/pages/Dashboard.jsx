import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const STATUS_LABEL = {
  active: 'Activo',
  paused: 'Pausado',
  pending: 'Pendiente'
}
const STATUS_COLOR = {
  active: '#8AD16C',
  paused: '#E8B84C',
  pending: '#8E8E94'
}

export default function Dashboard({ session, onOpenPrograms, onOpenClient }) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadClients() {
      const { data, error: fetchError } = await supabase
        .from('client_details')
        .select('id, goal, status, profiles!client_details_id_fkey(full_name)')
        .eq('trainer_id', session.user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setClients(data || [])
      }
      setLoading(false)
    }
    loadClients()
  }, [session.user.id])

  function copyInviteLink() {
    const link = window.location.origin + window.location.pathname + '?invite=' + session.user.id
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#101012',
        color: '#F5F4F0',
        fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif",
        padding: 24,
        boxSizing: 'border-box'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: '#CFFF5C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: '#101012',
              fontSize: 14
            }}
          >
            R
          </div>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 17, fontWeight: 800 }}>
            ROAFIT
          </div>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            background: 'transparent',
            border: '1px solid #2A2A2F',
            color: '#C8C8CC',
            borderRadius: 100,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Cerrar sesion
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <div style={{ background: '#1B1B1F', color: '#F5F4F0', border: '1px solid #2A2A2F', borderRadius: 100, padding: '7px 16px', fontSize: 13, fontWeight: 700 }}>
          Mis clientes
        </div>
        <button
          onClick={onOpenPrograms}
          style={{ background: 'transparent', color: '#C8C8CC', border: '1px solid #2A2A2F', borderRadius: 100, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          Programas
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: 24, fontWeight: 800 }}>
          Mis clientes
        </div>
        <button
          onClick={copyInviteLink}
          style={{
            background: '#CFFF5C',
            color: '#101012',
            border: 'none',
            borderRadius: 100,
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          {copied ? 'Enlace copiado' : '+ Invitar cliente'}
        </button>
      </div>
      <div style={{ fontSize: 13, color: '#8E8E94', marginBottom: 24 }}>
        {loading ? 'Cargando...' : clients.length + ' cliente' + (clients.length === 1 ? '' : 's')}
      </div>

      {error && (
        <div style={{ fontSize: 13, color: '#FF6B7F', marginBottom: 16 }}>
          Error al cargar clientes: {error}
        </div>
      )}

      {!loading && !error && clients.length === 0 && (
        <div
          style={{
            background: '#1B1B1F',
            border: '1px dashed #2A2A2F',
            borderRadius: 16,
            padding: 32,
            textAlign: 'center',
            color: '#8E8E94',
            fontSize: 14
          }}
        >
          Todavia no tienes clientes registrados.
          <br />
          Toca "+ Invitar cliente" para copiar tu enlace personal y enviaselo a tu primer cliente.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {clients.map((c) => (
          <div
            key={c.id}
            onClick={() => onOpenClient(c.id)}
            style={{
              background: '#1B1B1F',
              border: '1px solid #2A2A2F',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {c.profiles?.full_name || 'Sin nombre'}
              </div>
              <div style={{ fontSize: 12, color: '#8E8E94', marginTop: 2 }}>
                {c.goal || '-'}
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: STATUS_COLOR[c.status] || '#8E8E94'
              }}
            >
              {STATUS_LABEL[c.status] || c.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
