// Layout sem verificação de auth — acesso direto temporário
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:'Arial, sans-serif', background:'#f5f3ee' }}>
      <aside style={{ width:220, background:'#0a0f1e', color:'#fff', display:'flex', flexDirection:'column', flexShrink:0, padding:'24px 0' }}>
        <div style={{ padding:'0 20px 24px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, background:'#c8922a', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🏦</div>
            <div>
              <div style={{ fontSize:13, fontWeight:800 }}>BACEN Monitor</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>v2.0</div>
            </div>
          </div>
        </div>
        <nav style={{ padding:'16px 12px', flex:1 }}>
          {[
            { href:'/dashboard',          icon:'📊', label:'Dashboard'      },
            { href:'/dashboard/cadocs',   icon:'⚙️',  label:'CADOCs'         },
            { href:'/dashboard/entregas', icon:'📅', label:'Entregas'       },
            { href:'/dashboard/normas',   icon:'📋', label:'Normas'         },
            { href:'/dashboard/settings', icon:'⚙️',  label:'Configurações'  },
          ].map(item => (
            <a key={item.href} href={item.href} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, marginBottom:2, color:'rgba(255,255,255,0.6)', textDecoration:'none', fontSize:13, fontWeight:600 }}>
              <span style={{ fontSize:14 }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <div style={{ padding:'16px 20px', borderTop:'1px solid rgba(255,255,255,0.08)', fontSize:11, color:'rgba(255,255,255,0.25)' }}>
          Modo desenvolvimento
        </div>
      </aside>
      <main style={{ flex:1, overflow:'auto' }}>{children}</main>
    </div>
  )
}
