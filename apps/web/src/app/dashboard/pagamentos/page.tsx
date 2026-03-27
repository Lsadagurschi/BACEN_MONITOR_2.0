'use client'
import { useState } from 'react'

export default function PagamentosPage() {
  const [frameLoaded, setFrameLoaded] = useState(false)
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', background:'#f0f2f7' }}>
      <div style={{ padding:'10px 20px', background:'#fff', borderBottom:'1px solid rgba(0,0,0,.06)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, flexWrap:'wrap', gap:8 }}>
        <div>
          <h1 style={{ fontSize:16, fontWeight:800, color:'#111827', margin:'0 0 2px', letterSpacing:'-.3px' }}>⬡ CADOCs por Tipo de Instituição</h1>
          <p style={{ fontSize:11, color:'#6b7280', margin:0 }}>Matriz regulatória completa · S1–S5 · Adquirente · Emissor · ITP · SCD · PSAV · com análise de dispensa BCB</p>
        </div>
        <span style={{ fontSize:10, fontFamily:'monospace', fontWeight:700, padding:'3px 10px', borderRadius:20, background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:'#16a34a', display:'inline-block' }}/>
          Res. BCB 197/2022 · Res. BCB 80/2021
        </span>
      </div>
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
        {!frameLoaded&&(
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#f9fafb', zIndex:5 }}>
            <div style={{ width:36, height:36, border:'3px solid #0a7c5c', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite', marginBottom:12 }}/>
            <div style={{ fontSize:12, color:'#6b7280', fontWeight:500 }}>Carregando matriz regulatória…</div>
          </div>
        )}
        <iframe
          src="/bacen-monitor-original.html#pagamentos"
          onLoad={()=>setFrameLoaded(true)}
          style={{ width:'100%', height:'100%', border:'none', opacity:frameLoaded?1:0, transition:'opacity .3s' }}
          title="Meios de Pagamento — CADOC Matrix"
        />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
