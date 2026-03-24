'use client'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const nav = [
    { href:'/dashboard',              icon:'📊', label:'Dashboard'        },
    { href:'/dashboard/normas',       icon:'📋', label:'Normas BCB'       },
    { href:'/dashboard/cadocs',       icon:'⚙️',  label:'CADOCs'           },
    { href:'/dashboard/entregas',     icon:'📅', label:'Entregas'         },
    { href:'/dashboard/pagamentos',   icon:'💳', label:'Meios Pagamento'  },
    { href:'/dashboard/links',        icon:'🔗', label:'Links Úteis'      },
    { href:'/dashboard/settings',     icon:'🔧', label:'Configurações'    },
  ]

  const isCadocs = pathname.startsWith('/dashboard/cadocs')

  return (
    <div style={{ display:'flex', height:'100vh', fontFamily:"'Plus Jakarta Sans',Arial,sans-serif", background:'#f5f6f8', overflow:'hidden' }}>
      <aside style={{ width:210, background:'#0d1117', color:'#fff', display:'flex', flexDirection:'column', flexShrink:0, borderRight:'1px solid rgba(255,255,255,0.06)' }}>
        {/* Brand */}
        <div style={{ padding:'16px 16px 14px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:30, height:30, background:'linear-gradient(135deg,#0a7c5c,#1d5fcc)', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>🏦</div>
          <div>
            <div style={{ fontSize:13, fontWeight:800, letterSpacing:'-.4px' }}>BACEN Monitor</div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', fontFamily:'monospace', marginTop:1 }}>v2.0 SaaS · RegTech</div>
          </div>
        </div>
        {/* Nav */}
        <nav style={{ padding:'10px 8px', flex:1, overflowY:'auto' }}>
          {nav.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <a key={item.href} href={item.href} style={{
                display:'flex', alignItems:'center', gap:9,
                padding:'8px 10px', borderRadius:7, marginBottom:2,
                color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                background: active ? 'rgba(255,255,255,0.09)' : 'transparent',
                textDecoration:'none', fontSize:12.5, fontWeight: active ? 700 : 400,
                borderLeft: active ? '2px solid #0a7c5c' : '2px solid transparent',
                transition:'all .15s'
              }}>
                <span style={{ fontSize:13 }}>{item.icon}</span>
                {item.label}
              </a>
            )
          })}
        </nav>
        {/* Footer */}
        <div style={{ padding:'10px 14px', borderTop:'1px solid rgba(255,255,255,0.06)', fontSize:9, color:'rgba(255,255,255,0.18)', fontFamily:'monospace', lineHeight:1.6 }}>
          BACEN Monitor SaaS<br/>
          <span style={{ color:'rgba(10,124,92,0.7)' }}>● Sistema ativo</span>
        </div>
      </aside>
      <main style={{ flex:1, overflow: isCadocs ? 'hidden' : 'auto', display:'flex', flexDirection:'column' }}>
        {children}
      </main>
    </div>
  )
}
