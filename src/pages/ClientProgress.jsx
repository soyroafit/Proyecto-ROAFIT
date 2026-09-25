import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ClientProgress({ session, onBack }) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('logged_sets')
        .select('id, set_number, actual_reps, actual_weight_kg, logged_at, planned_exercises(name)')
        .eq('client_id', session.user.id)
        .order('logged_at', { ascending: false })
        .limit(100)

      const byName = {}
      for (const row of data || []) {
        const name = row.planned_exercises?.name || 'Ejercicio'
        if (!byName[name]) byName[name] = []
        if (byName[name].length < 5) byName[name].push(row)
      }
      setGroups(Object.entries(byName))
      setLoading(false)
    }
    load()
  }, [session.user.id])

  return (
    <div style={{ minHeight: '100vh', background: '#101012', color: '#F5F4F0', fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif", padding: 24, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#CFFF5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#101012', fontSize: 14 }}>R</div>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 17, fontWeight: 800 }}>ROAFIT</div>
        </div>
        <button onClick={() => supabase.auth.signOut()} style={{ background: 'transparent', border: '1px solid #2A2A2F', color: '#C8C8CC', borderRadius: 100, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cerrar sesion</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'transparent', color: '#C8C8CC', border: '1px solid #2A2A2F', borderRadius: 100, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Hoy</button>
        <div style={{ background: '#1B1B1F', color: '#F5F4F0', border: '1px solid #2A2A2F', borderRadius: 100, padding: '7px 16px', fontSize: 13, fontWeight: 700 }}>Progreso</div>
      </div>

      <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Mi progreso</div>

      {loading && <div style={{ color: '#8E8E94', fontSize: 13 }}>Cargando...</div>}
      {!loading && groups.length === 0 && (
        <div style={{ background: '#1B1B1F', border: '1px dashed #2A2A2F', borderRadius: 16, padding: 32, textAlign: 'center', color: '#8E8E94', fontSize: 14 }}>
          Todavia no has registrado ninguna serie.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groups.map(([name, rows]) => (
          <div key={name} style={{ background: '#1B1B1F', border: '1px solid #2A2A2F', borderRadius: 14, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{name}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {rows.map((r) => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#8E8E94' }}>{new Date(r.logged_at).toLocaleDateString()}</span>
                  <span style={{ color: '#8AD16C', fontWeight: 700 }}>{r.actual_weight_kg} kg x {r.actual_reps}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
