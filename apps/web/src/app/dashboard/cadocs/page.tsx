'use client'
import { useState } from 'react'

export default function CadocsPage() {
  const [loaded, setLoaded] = useState(false)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      {/* Banda de contexto mínima */}
      <div style={{ padding:'10px 22px', background:'#fff', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div>
          <h1 style={{ fontSize:15, fontWeight:700, color:'#111827', margin:0, letterSpacing:'-.3px' }}>⊠ Geração e Validação de CADOCs</h1>
          <p style={{ fontSize:11, color:'#9ca3af', margin:'2px 0 0' }}>315 regras SCR3040 · RSS BCB ao vivo · Análise comparativa 3040 · Importador 6334 · Calendário de prazos</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ fontSize:10, fontFamily:'monospace', fontWeight:700, padding:'3px 10px', borderRadius:20, background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#16a34a', display:'inline-block' }}/>
            CADOC · BCB · STA
          </div>
        </div>
      </div>

      {/* Iframe full do HTML original — contém toda a lógica */}
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
        {!loaded && (
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#f9fafb', zIndex:5 }}>
            <div style={{ width:34, height:34, border:'3px solid #0d6e52', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite', marginBottom:12 }}/>
            <div style={{ fontSize:12, color:'#6b7280', fontWeight:500 }}>Carregando módulo CADOC…</div>
          </div>
        )}
        <iframe
          src="/bacen-monitor-original.html"
          onLoad={() => setLoaded(true)}
          style={{ width:'100%', height:'100%', border:'none', opacity: loaded ? 1 : 0, transition:'opacity .3s' }}
          title="BACEN Monitor — CADOCs"
        />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
