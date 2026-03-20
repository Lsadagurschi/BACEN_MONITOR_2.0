'use client'
import { usePathname } from 'next/navigation'
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const nav = [
    { href:'/dashboard',          icon:'📊', label:'Dashboard'     },
    { href:'/dashboard/cadocs',   icon:'⚙️',  label:'CADOCs'        },
    { href:'/dashboard/entregas', icon:'📅', label:'Entregas'      },
    { href:'/dashboard/settings', icon:'🔧', label:'Configurações' },
  ]
  return (
    <div style={{display:'flex',minHeight:'100vh',fontFamily:'Arial,sans-serif',background:'#f5f3ee'}}>
      <aside style={{width:220,background:'#0a0f1e',color:'#fff',display:'flex',flexDirection:'column',flexShrink:0,position:'sticky',top:0,height:'100vh'}}>
        <div style={{padding:'20px 20px 20px',borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:32,background:'#c8922a',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🏦</div>
          <div><div style={{fontSize:13,fontWeight:800}}>BACEN Monitor</div><div style={{fontSize:10,color:'rgba(255,255,255,0.4)'}}>v2.0 SaaS</div></div>
        </div>
        <nav style={{padding:'16px 12px',flex:1}}>
          {nav.map(item=>{
            const active=pathname===item.href||(item.href!=='/dashboard'&&pathname.startsWith(item.href))
            return <a key={item.href} href={item.href} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:8,marginBottom:2,color:active?'#fff':'rgba(255,255,255,0.5)',background:active?'rgba(255,255,255,0.1)':'transparent',textDecoration:'none',fontSize:13,fontWeight:600,borderLeft:active?'2px solid #c8922a':'2px solid transparent',transition:'all .15s'}}>
              <span style={{fontSize:14}}>{item.icon}</span>{item.label}
            </a>
          })}
        </nav>
        <div style={{padding:'16px 20px',borderTop:'1px solid rgba(255,255,255,0.08)',fontSize:11,color:'rgba(255,255,255,0.25)'}}>BACEN Monitor SaaS</div>
      </aside>
      <main style={{flex:1,overflow:'auto'}}>{children}</main>
    </div>
  )
}
