'use client'
import { useState, useEffect } from 'react'

export default function CadocsPage() {
  const [apiKey, setApiKey] = useState('')
  const [frameLoaded, setFrameLoaded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setApiKey(localStorage.getItem('bm_api_key') || '')
    }
  }, [])

  const onLoad = () => { setFrameLoaded(true) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#f0f2f7' }}>
      <div style={{ padding: '10px 20px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 2px', letterSpacing: '-.3px' }}>◎ Geração, Validação e Importação de CADOCs</h1>
          <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>315 regras SCR3040 · Feeds RSS BCB ao vivo · Análise Comparativa 3040 · Importador 6334 · Calendário de entregas</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }}/>
            CADOC · BCB · LIVE
          </span>
          {!apiKey && <a href="/dashboard/settings" style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', textDecoration: 'none', fontWeight: 600 }}>⚠ Configure API Key →</a>}
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {!frameLoaded && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', zIndex: 5 }}>
            <div style={{ width: 36, height: 36, border: '3px solid #0a7c5c', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite', marginBottom: 12 }}/>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Carregando BACEN Monitor v2…</div>
          </div>
        )}
        <iframe
          id="bacen-frame"
          src="/bacen-monitor-original.html"
          onLoad={onLoad}
          style={{ width: '100%', height: '100%', border: 'none', opacity: frameLoaded ? 1 : 0, transition: 'opacity .3s' }}
          title="BACEN Monitor — CADOCs"
        />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
