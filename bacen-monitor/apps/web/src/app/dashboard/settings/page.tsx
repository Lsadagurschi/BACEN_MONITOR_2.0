export default function SettingsPage() {
  return(
    <div style={{padding:'28px 32px',maxWidth:640}}>
      <h1 style={{fontSize:22,fontWeight:800,color:'#0a0f1e',marginBottom:4}}>Configurações</h1>
      <p style={{fontSize:13,color:'#6b7280',marginBottom:24}}>Dados da instituição, plano e usuários.</p>
      {[
        {title:'Instituição Financeira',fields:[['Razão Social','BANCO EXEMPLO S.A.'],['CNPJ','12.345.678/0001-99'],['ISPB','12345678'],['Tipo IF','Banco (B)']]},
        {title:'Plano Atual',fields:[['Plano','Professional'],['Operações/mês','50.000 incluídas'],['Excedente','R$ 0,05/op'],['Renovação','01/04/2026']]},
      ].map(section=>(
        <div key={section.title} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,overflow:'hidden',marginBottom:16}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid #f1f5f9',fontSize:12,fontWeight:700,color:'#0a0f1e'}}>{section.title}</div>
          <div style={{padding:'8px 0'}}>
            {section.fields.map(([k,v])=>(
              <div key={k} style={{display:'grid',gridTemplateColumns:'180px 1fr',padding:'10px 16px',borderBottom:'1px solid #f8fafc',fontSize:12}}>
                <span style={{color:'#6b7280',fontWeight:600}}>{k}</span>
                <span style={{color:'#0a0f1e'}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,padding:'20px',textAlign:'center'}}>
        <div style={{fontSize:13,color:'#6b7280'}}>Autenticação, usuários e billing em breve.</div>
      </div>
    </div>
  )
}
