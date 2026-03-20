export default function EntregasPage() {
  const today = new Date()
  const cadocs = [
    {cod:'3040',nome:'SCR Operações de Crédito',per:'Mensal',prazo:new Date(today.getFullYear(),today.getMonth()+1,7),entregue:true},
    {cod:'3044',nome:'SCR Eventos de Crédito',per:'Por evento',prazo:new Date(today.getFullYear(),today.getMonth(),today.getDate()+3),entregue:false},
    {cod:'4010',nome:'Balancete COSIF',per:'Mensal',prazo:new Date(today.getFullYear(),today.getMonth()+1,13),entregue:false},
    {cod:'6334',nome:'Cartões Credenciadores',per:'Trimestral',prazo:new Date(today.getFullYear(),6,31),entregue:true},
    {cod:'3060',nome:'SCR Taxas de Juros',per:'Semanal',prazo:new Date(today.getFullYear(),today.getMonth(),today.getDate()+5),entregue:false},
  ]
  const fmtDate=(d:Date)=>d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})
  const diasRestantes=(d:Date)=>Math.ceil((d.getTime()-today.getTime())/(1000*60*60*24))
  const vencidos=cadocs.filter(c=>!c.entregue&&diasRestantes(c.prazo)<0).length
  const urgentes=cadocs.filter(c=>!c.entregue&&diasRestantes(c.prazo)>=0&&diasRestantes(c.prazo)<=7).length
  return(
    <div style={{padding:'28px 32px'}}>
      <h1 style={{fontSize:22,fontWeight:800,color:'#0a0f1e',marginBottom:4}}>Entregas Regulatórias</h1>
      <p style={{fontSize:13,color:'#6b7280',marginBottom:24}}>Calendário de vencimentos e status de entregas ao BCB.</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
        {([
          ['Status geral',vencidos>0?'🔴 CRÍTICO':urgentes>0?'🟡 ATENÇÃO':'🟢 OK',vencidos>0?'#ef4444':urgentes>0?'#f59e0b':'#22c55e'],
          ['Vencidos',String(vencidos),vencidos>0?'#ef4444':'#22c55e'],
          ['Urgentes ≤7d',String(urgentes),urgentes>0?'#f59e0b':'#22c55e'],
          ['Total CADOCs',String(cadocs.length),'#0891b2'],
        ] as [string,string,string][]).map(([l,v,c])=>(
          <div key={l} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,padding:'16px 18px',borderTop:`3px solid ${c}`}}>
            <div style={{fontSize:18,fontWeight:900,color:c,fontFamily:'monospace'}}>{v}</div>
            <div style={{fontSize:11,color:'#6b7280',marginTop:4}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,overflow:'hidden'}}>
        <div style={{padding:'12px 16px',borderBottom:'1px solid #f1f5f9',fontSize:12,fontWeight:700,color:'#0a0f1e'}}>📅 Calendário de Vencimentos</div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:'#f8fafc'}}>
            {['CADOC','Documento','Periodicidade','Prazo','Dias','Status'].map(h=><th key={h} style={{padding:'8px 14px',textAlign:'left',fontSize:10,fontWeight:600,color:'#64748b'}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {cadocs.sort((a,b)=>a.prazo.getTime()-b.prazo.getTime()).map(c=>{
              const dias=diasRestantes(c.prazo)
              const cor=c.entregue?'#22c55e':dias<0?'#ef4444':dias<=7?'#f59e0b':'#6b7280'
              const badge=c.entregue?{bg:'#f0fdf4',color:'#166534',txt:'✓ Entregue'}:dias<0?{bg:'#fef2f2',color:'#991b1b',txt:`${Math.abs(dias)}d atraso`}:dias<=7?{bg:'#fffbeb',color:'#92400e',txt:`${dias}d restantes`}:{bg:'#f0f9ff',color:'#075985',txt:`${dias}d restantes`}
              return(
                <tr key={c.cod} style={{borderTop:'1px solid #f8fafc'}}>
                  <td style={{padding:'10px 14px',fontFamily:'monospace',fontWeight:700,color:'#0a0f1e'}}>{c.cod}</td>
                  <td style={{padding:'10px 14px',color:'#374151'}}>{c.nome}</td>
                  <td style={{padding:'10px 14px',color:'#6b7280',fontSize:11}}>{c.per}</td>
                  <td style={{padding:'10px 14px',fontFamily:'monospace',fontSize:11,color:'#374151'}}>{fmtDate(c.prazo)}</td>
                  <td style={{padding:'10px 14px',fontWeight:700,fontFamily:'monospace',color:cor}}>{c.entregue?'—':dias<0?`-${Math.abs(dias)}`:`+${dias}`}</td>
                  <td style={{padding:'10px 14px'}}><span style={{fontSize:10,padding:'2px 8px',borderRadius:4,fontWeight:700,background:badge.bg,color:badge.color}}>{badge.txt}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
