'use client'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const NAV = [
  { href:'/dashboard',            icon:'⊟', label:'Dashboard'       },
  { href:'/dashboard/normas',     icon:'⊞', label:'Normas BCB'      },
  { href:'/dashboard/cadocs',     icon:'⊠', label:'CADOCs'          },
  { href:'/dashboard/entregas',   icon:'⊡', label:'Entregas'        },
  { href:'/dashboard/pagamentos', icon:'⊛', label:'Matriz IFs'      },
  { href:'/dashboard/links',      icon:'⊕', label:'Links'           },
  { href:'/dashboard/settings',   icon:'⊙', label:'Configurações'   },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [col, setCol] = useState(false)
  const [clock, setClock] = useState('')
  const [nomeIF, setNomeIF] = useState('')

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', second:'2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNomeIF(localStorage.getItem('bm_nome') || '')
    }
  }, [pathname])

  const currentLabel = NAV.find(n =>
    n.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(n.href)
  )?.label || 'Dashboard'

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', fontFamily:"'Inter','SF Pro Display',system-ui,sans-serif", background:'#f1f3f7' }}>

      {/* ─── SIDEBAR ─────────────────────────────────────────────── */}
      <aside style={{
        width: col ? 56 : 228,
        flexShrink: 0,
        transition: 'width .22s ease',
        background: 'linear-gradient(180deg,#0c1220 0%,#0a0e1a 100%)',
        borderRight: '1px solid rgba(255,255,255,.06)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Brand */}
        <div style={{ height:56, padding:'0 14px', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#0d6e52 0%,#1248a0 100%)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 2px 12px rgba(13,110,82,.35)' }}>
            <span style={{ fontSize:13, fontWeight:900, color:'#fff', letterSpacing:'-1px', fontFamily:'monospace' }}>BM</span>
          </div>
          {!col && (
            <div style={{ overflow:'hidden', minWidth:0 }}>
              <div style={{ fontSize:13.5, fontWeight:700, color:'#fff', letterSpacing:'-.4px', whiteSpace:'nowrap' }}>BACEN Monitor</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,.22)', fontFamily:'monospace', marginTop:1 }}>RegTech Platform · v2.0</div>
            </div>
          )}
          <button onClick={() => setCol(!col)} style={{ marginLeft:'auto', background:'none', border:'none', color:'rgba(255,255,255,.2)', fontSize:14, cursor:'pointer', outline:'none', flexShrink:0, lineHeight:1, padding:2 }}>
            {col ? '›' : '‹'}
          </button>
        </div>

        {/* IF Badge */}
        {!col && nomeIF && (
          <div style={{ padding:'7px 14px 5px', borderBottom:'1px solid rgba(255,255,255,.04)', flexShrink:0 }}>
            <div style={{ fontSize:10.5, fontWeight:500, color:'rgba(255,255,255,.55)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nomeIF}</div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'10px 6px' }}>
          {NAV.map(item => {
            const active = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
            return (
              <a key={item.href} href={item.href} title={col ? item.label : ''} style={{
                display:'flex', alignItems:'center', gap:10,
                padding: col ? '10px 12px' : '9px 11px',
                borderRadius:8, marginBottom:2,
                textDecoration:'none',
                color: active ? '#fff' : 'rgba(255,255,255,.32)',
                background: active ? 'rgba(13,110,82,.22)' : 'transparent',
                borderLeft: `2px solid ${active ? '#0d9166' : 'transparent'}`,
                justifyContent: col ? 'center' : 'flex-start',
                transition:'all .14s',
              }}>
                <span style={{ fontSize:14, flexShrink:0, opacity: active ? 1 : 0.65 }}>{item.icon}</span>
                {!col && <span style={{ fontSize:12.5, fontWeight: active ? 600 : 400, whiteSpace:'nowrap' }}>{item.label}</span>}
                {!col && active && <div style={{ marginLeft:'auto', width:5, height:5, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 5px #22c55e' }}/>}
              </a>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: col ? '12px 0' : '10px 14px', borderTop:'1px solid rgba(255,255,255,.05)', flexShrink:0 }}>
          {col ? (
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', margin:'0 auto', boxShadow:'0 0 6px #22c55e' }}/>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', flexShrink:0, boxShadow:'0 0 6px #22c55e80' }}/>
              <span style={{ fontSize:9.5, color:'rgba(255,255,255,.2)', fontFamily:'monospace' }}>{clock}</span>
              <span style={{ marginLeft:'auto', fontSize:9, color:'rgba(255,255,255,.15)', fontFamily:'monospace' }}>BCB · STA</span>
            </div>
          )}
        </div>
      </aside>

      {/* ─── CONTEÚDO ─────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Topbar */}
        <header style={{ height:56, flexShrink:0, background:'#fff', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', padding:'0 24px', gap:14, boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:11, color:'#9ca3af' }}>BACEN Monitor</span>
            <span style={{ fontSize:11, color:'#d1d5db' }}>›</span>
            <span style={{ fontSize:13, fontWeight:700, color:'#111827' }}>{currentLabel}</span>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 11px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:20 }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'#16a34a', boxShadow:'0 0 5px #16a34a' }}/>
              <span style={{ fontSize:10, color:'#15803d', fontWeight:700, fontFamily:'monospace' }}>BCB · LIVE</span>
            </div>
            <span style={{ fontSize:11, color:'#6b7280', fontFamily:'monospace' }}>{clock}</span>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, overflow:'auto' }}>
          {children}
        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,.14); border-radius: 8px; }
        nav a:hover { background: rgba(255,255,255,.06) !important; color: rgba(255,255,255,.65) !important; }
      `}</style>
    </div>
  )
}
