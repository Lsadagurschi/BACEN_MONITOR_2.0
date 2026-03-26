'use client'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV = [
  { href:'/dashboard',            icon:'📊', label:'Dashboard',        badge:'' },
  { href:'/dashboard/normas',     icon:'📋', label:'Normas BCB',       badge:'LIVE' },
  { href:'/dashboard/cadocs',     icon:'⚙️',  label:'Geração CADOC',    badge:'' },
  { href:'/dashboard/entregas',   icon:'📅', label:'Entregas',         badge:'' },
  { href:'/dashboard/pagamentos', icon:'💳', label:'Meios Pagamento',  badge:'' },
  { href:'/dashboard/links',      icon:'🔗', label:'Links Úteis',      badge:'' },
  { href:'/dashboard/settings',   icon:'🔧', label:'Configurações',    badge:'' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", background:'#f0f2f5' }}>
      <aside style={{ width:collapsed?56:220, flexShrink:0, transition:'width .2s ease', background:'linear-gradient(180deg,#0d1117 0%,#0f1923 100%)', borderRight:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'14px 12px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ width:32, height:32, background:'linear-gradient(135deg,#0a7c5c 0%,#1d5fcc 100%)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>🏦</div>
          {!collapsed && <div style={{ overflow:'hidden' }}><div style={{ fontSize:12.5, fontWeight:800, color:'#fff', letterSpacing:'-.3px', whiteSpace:'nowrap' }}>BACEN Monitor</div><div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', fontFamily:'monospace', whiteSpace:'nowrap' }}>v2.0 · RegTech Platform</div></div>}
          <button onClick={()=>setCollapsed(!collapsed)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', fontSize:16, flexShrink:0, padding:2, lineHeight:1, outline:'none' }}>{collapsed?'›':'‹'}</button>
        </div>
        <nav style={{ padding:'8px 6px', flex:1, overflowY:'auto', overflowX:'hidden' }}>
          {!collapsed && <div style={{ fontSize:8, letterSpacing:2, textTransform:'uppercase', color:'rgba(255,255,255,0.2)', padding:'8px 8px 4px', fontFamily:'monospace', fontWeight:600 }}>PLATAFORMA</div>}
          {NAV.map(item => {
            const active = item.href==='/dashboard' ? pathname==='/dashboard' : pathname.startsWith(item.href)
            return (
              <a key={item.href} href={item.href} title={collapsed?item.label:''} style={{ display:'flex', alignItems:'center', gap:9, padding:collapsed?'9px 12px':'8px 10px', borderRadius:7, marginBottom:2, textDecoration:'none', color:active?'#fff':'rgba(255,255,255,0.4)', background:active?'rgba(10,124,92,0.25)':'transparent', borderLeft:active?'2px solid #0a7c5c':'2px solid transparent', transition:'all .15s', justifyContent:collapsed?'center':'flex-start' }}>
                <span style={{ fontSize:14, flexShrink:0 }}>{item.icon}</span>
                {!collapsed && <><span style={{ fontSize:12, fontWeight:active?700:400, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.label}</span>{item.badge&&<span style={{ marginLeft:'auto', fontSize:7.5, fontFamily:'monospace', fontWeight:800, background:'#0a7c5c', color:'#fff', padding:'1px 4px', borderRadius:3, flexShrink:0 }}>{item.badge}</span>}</>}
              </a>
            )
          })}
        </nav>
        {!collapsed && <div style={{ padding:'10px 12px', borderTop:'1px solid rgba(255,255,255,0.05)', fontSize:8.5, color:'rgba(255,255,255,0.15)', fontFamily:'monospace', lineHeight:1.7, flexShrink:0 }}><div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}><div style={{ width:5, height:5, borderRadius:'50%', background:'#0a7c5c' }}/><span style={{ color:'rgba(10,124,92,0.7)' }}>Sistema ativo</span></div>BCB · CMN · SPB · SCR</div>}
      </aside>
      <main style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column', minWidth:0 }}>
        {children}
      </main>
    </div>
  )
}
