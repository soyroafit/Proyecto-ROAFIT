import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'

export default function App() {
  const [status, setStatus] = useState('Comprobando conexion con Supabase...')
    const [ok, setOk] = useState(null)

      useEffect(() => {
          async function checkConnection() {
                const { error } = await supabase.from('profiles').select('id').limit(1)

                      if (error) {
                              setOk(false)
                                      setStatus('Error de conexion: ' + error.message)
                                            } else {
                                                    setOk(true)
                                                            setStatus('Conectado a Supabase correctamente. La base de fase 1 esta lista.')
                                                                  }
                                                                      }
                                                                          checkConnection()
                                                                            }, [])

                                                                              return (
                                                                                  <div style={{ minHeight: '100vh', background: '#101012', color: '#F5F4F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center', fontFamily: 'sans-serif' }}>
                                                                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#CFFF5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#101012' }}>R</div>
                                                                                              <div style={{ fontSize: 22, fontWeight: 800 }}>ROAFIT - Fase 1</div>
                                                                                                    <div style={{ maxWidth: 420, fontSize: 14, color: ok === false ? '#FF6B7F' : ok === true ? '#8AD16C' : '#8E8E94' }}>{status}</div>
                                                                                                        </div>
                                                                                                          )
                                                                                                          }
                                                                                                          
