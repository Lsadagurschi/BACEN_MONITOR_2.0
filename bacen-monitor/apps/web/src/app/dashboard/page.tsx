export default function DashboardPage() {
  return (
    <div style={{ padding:'32px 36px' }}>
      <h1 style={{ fontSize:24, fontWeight:800, color:'#0a0f1e', marginBottom:8 }}>Dashboard Executivo</h1>
      <p style={{ fontSize:14, color:'#6b7280', marginBottom:32 }}>Visão geral da conformidade regulatória</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:32 }}>
        {([['Status','🟢 OK','#22c55e'],['Vencidos','0','#22c55e'],['Urgentes ≤7d','0','#22c55e'],['Jobs','0','#0891b2']] as [string,string,string][]).map(([label,value,color]) => (
          <div key={label} style={{ background:'#fff', border:'1px solid #d1c9b8', borderRadius:12, padding:20, borderTop:`3px solid ${color}` }}>
            <div style={{ fontSize:22, fontWeight:900, color, fontFamily:'Courier New' }}>{value}</div>
            <div style={{ fontSize:12, color:'#6b7280', marginTop:4 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'#fff', border:'1px solid #d1c9b8', borderRadius:12, padding:32, textAlign:'center' }}>
        <div style={{ fontSize:32, marginBottom:12 }}>🏦</div>
        <div style={{ fontSize:16, fontWeight:700, color:'#0a0f1e', marginBottom:8 }}>BACEN Monitor está no ar!</div>
        <div style={{ fontSize:14, color:'#6b7280', lineHeight:1.7 }}>Plataforma RegTech para CADOCs regulatórios do BCB.</div>
      </div>
    </div>
  )
}
