'use client'
import { useState } from 'react'

export default function PagamentosPage() {
  const [loaded, setLoaded] = useState(false)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <div style={{ padding:'10px 22px', background:'#fff', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div>
          <h1 style={{ fontSize:15, fontWeight:700, color:'#111827', margin:0, letterSpacing:'-.3px' }}>⊛ Matriz Regulatória por Tipo de IF</h1>
          <p style={{ fontSize:11, color:'#9ca3af', margin:'2px 0 0' }}>S1–S5 · Adquirente · Subadquirente · Emissor Pré/Pós · ITP · SCD · PSAV — com análise de dispensa BCB</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <span style={{ fontSize:10, fontFamily:'monospace', fontWeight:700, padding:'3px 10px', borderRadius:20, background:'#eff6ff', color:'#1d4ed8', border:'1px solid #bfdbfe' }}>Res. BCB 197/2022</span>
          <span style={{ fontSize:10, fontFamily:'monospace', fontWeight:700, padding:'3px 10px', borderRadius:20, background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0' }}>Res. BCB 80/2021</span>
        </div>
      </div>
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
        {!loaded && (
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#f9fafb', zIndex:5 }}>
            <div style={{ width:34, height:34, border:'3px solid #0d6e52', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite', marginBottom:12 }}/>
            <div style={{ fontSize:12, color:'#6b7280' }}>Carregando matriz regulatória…</div>
          </div>
        )}
        <iframe src="/bacen-monitor-original.html" onLoad={() => setLoaded(true)} style={{ width:'100%', height:'100%', border:'none', opacity:loaded?1:0, transition:'opacity .3s' }} title="Matriz CADOCs por tipo de IF"/>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
