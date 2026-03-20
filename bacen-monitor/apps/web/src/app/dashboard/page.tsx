export default function DashboardPage() {
  const kpis=[['Status','🟢 OK','#22c55e'],['Vencidos','0','#22c55e'],['Urgentes ≤7d','0','#22c55e'],['Jobs','0','#0891b2']] as [string,string,string][]
  const cadocs=[
    {cod:'3040',nome:'SCR Operações de Crédito',per:'Mensal · D+5',status:'ok'},
    {cod:'3044',nome:'SCR Eventos de Crédito',per:'Por evento · D+5',status:'ok'},
    {cod:'4010',nome:'Balancete COSIF',per:'Mensal · D+9',status:'warn'},
    {cod:'6334',nome:'Cartões Credenciadores',per:'Trimestral',status:'ok'},
    {cod:'3060',nome:'SCR Taxas de Juros',per:'Semanal · D+5',status:'ok'},
  ]
  return (
    <div style={{padding:'28px 32px'}}>
      <h1 style={{fontSize:22,fontWeight:800,color:'#0a0f1e',marginBottom:4}}>Dashboard Executivo</h1>
      <p style={{fontSize:13,color:'#6b7280',marginBottom:24}}>Visão geral da conformidade regulatória</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
        {kpis.map(([label,value,color])=>(
          <div key={label} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,padding:'16px 18px',borderTop:`3px solid ${color}`}}>
            <div style={{fontSize:20,fontWeight:900,color,fontFamily:'monospace'}}>{value}</div>
            <div style={{fontSize:11,color:'#6b7280',marginTop:4}}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,overflow:'hidden',marginBottom:20}}>
        <div style={{padding:'12px 16px',borderBottom:'1px solid #f1f5f9',fontSize:12,fontWeight:700,color:'#0a0f1e',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>📋 Status de Cobertura por CADOC</span>
          <a href="/dashboard/cadocs" style={{fontSize:11,color:'#1a5f8a',textDecoration:'none',fontWeight:600}}>Gerar CADOCs →</a>
        </div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:'#f8fafc'}}>
            {['CADOC','Documento','Periodicidade','Status'].map(h=><th key={h} style={{padding:'8px 14px',textAlign:'left',fontSize:10,fontWeight:600,color:'#64748b',letterSpacing:'0.5px'}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {cadocs.map(c=>(
              <tr key={c.cod} style={{borderTop:'1px solid #f8fafc'}}>
                <td style={{padding:'10px 14px',fontFamily:'monospace',fontWeight:700,fontSize:12,color:'#0a0f1e'}}>{c.cod}</td>
                <td style={{padding:'10px 14px',fontSize:12,color:'#374151'}}>{c.nome}</td>
                <td style={{padding:'10px 14px',fontSize:11,color:'#6b7280'}}>{c.per}</td>
                <td style={{padding:'10px 14px'}}>
                  <span style={{fontSize:10,padding:'2px 8px',borderRadius:4,fontWeight:700,background:c.status==='ok'?'#f0fdf4':'#fffbeb',color:c.status==='ok'?'#166534':'#92400e'}}>
                    {c.status==='ok'?'✓ Em dia':'⚠ Pendente'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,padding:'24px',textAlign:'center'}}>
        <div style={{fontSize:28,marginBottom:8}}>🏦</div>
        <div style={{fontSize:14,fontWeight:700,color:'#0a0f1e',marginBottom:6}}>BACEN Monitor está no ar!</div>
        <div style={{fontSize:12,color:'#6b7280',lineHeight:1.7}}>Use a aba <strong>CADOCs</strong> para gerar e validar documentos regulatórios.</div>
      </div>
    </div>
  )
}
