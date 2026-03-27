'use client'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard',            icon: '◈',  label: 'Dashboard',          sub: 'Visão executiva' },
  { href: '/dashboard/normas',     icon: '⊞',  label: 'Normas BCB',         sub: 'Feed regulatório' },
  { href: '/dashboard/cadocs',     icon: '◎',  label: 'Geração CADOC',      sub: '315 regras BCB' },
  { href: '/dashboard/entregas',   icon: '◷',  label: 'Entregas',           sub: 'Calendário' },
  { href: '/dashboard/pagamentos', icon: '⬡',  label: 'Meios Pagamento',    sub: 'CADOC por IF' },
  { href: '/dashboard/links',      icon: '⊕',  label: 'Links Úteis',        sub: 'Portais BCB' },
  { href: '/dashboard/settings',   icon: '◈',  label: 'Configurações',      sub: 'API & IF' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [time, setTime] = useState('')
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('')

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNome(localStorage.getItem('bm_nome') || '')
      setTipo(localStorage.getItem('bm_tipo') || '')
    }
  }, [pathname])

  const TIPO_LABELS: Record<string,string> = {
    banco_multiplo:'Banco Múltiplo', banco_comercial:'Banco Comercial', financeira:'Financeira/SCFI',
    scd:'SCD', emissor_pre:'Emissor EME', adquirente:'Adquirente', subcreden:'Subcredenciador',
    itp:'ITP', cooperativa:'Cooperativa', psav:'PSAV', consorcio:'Consórcio'
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif", background: '#0b0f19' }}>
      
      {/* ── SIDEBAR ── */}
      <aside style={{
        width: collapsed ? 64 : 240,
        flexShrink: 0,
        transition: 'width .25s cubic-bezier(.4,0,.2,1)',
        background: 'linear-gradient(180deg,#0d1117 0%,#0a0e18 100%)',
        borderRight: '1px solid rgba(255,255,255,.06)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', position: 'relative',
      }}>
        
        {/* Brand */}
        <div style={{
          padding: collapsed ? '18px 16px' : '18px 20px',
          borderBottom: '1px solid rgba(255,255,255,.06)',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
          minHeight: 64,
        }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg,#1a6b52 0%,#0d4c8f 100%)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: 16, fontWeight: 800, color: '#fff',
            boxShadow: '0 4px 14px rgba(26,107,82,.4)',
            letterSpacing: '-1px',
          }}>BM</div>
          {!collapsed && (
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-.4px', whiteSpace: 'nowrap' }}>BACEN Monitor</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', fontFamily: 'monospace', whiteSpace: 'nowrap', marginTop: 1 }}>RegTech Platform · v2.0</div>
            </div>
          )}
        </div>

        {/* IF info */}
        {!collapsed && nome && (
          <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,.04)', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome}</div>
            {tipo && <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,.35)', marginTop: 2, fontFamily: 'monospace' }}>{TIPO_LABELS[tipo] || tipo}</div>}
          </div>
        )}

        {/* Nav */}
        <nav style={{ padding: collapsed ? '10px 8px' : '10px 10px', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {!collapsed && (
            <div style={{ fontSize: 8.5, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,.18)', padding: '8px 10px 4px', fontFamily: 'monospace', fontWeight: 600 }}>
              MÓDULOS
            </div>
          )}
          {NAV_ITEMS.map((item, i) => {
            const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
            return (
              <a key={item.href} href={item.href} title={collapsed ? item.label : ''} style={{
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : 11,
                padding: collapsed ? '10px 16px' : '9px 12px',
                borderRadius: 8, marginBottom: 2,
                textDecoration: 'none',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: active ? '#fff' : 'rgba(255,255,255,.38)',
                background: active ? 'rgba(26,107,82,.22)' : 'transparent',
                borderLeft: active ? '2px solid #1a6b52' : '2px solid transparent',
                transition: 'all .15s ease',
                position: 'relative',
              }}>
                <span style={{
                  fontSize: 16, flexShrink: 0, opacity: active ? 1 : 0.6,
                  color: active ? '#4ade80' : 'rgba(255,255,255,.5)',
                }}>{item.icon}</span>
                {!collapsed && (
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap', lineHeight: 1.2 }}>{item.label}</div>
                    <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,.25)', marginTop: 1, whiteSpace: 'nowrap' }}>{item.sub}</div>
                  </div>
                )}
                {active && !collapsed && (
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', marginLeft: 'auto', flexShrink: 0 }}/>
                )}
              </a>
            )
          })}
        </nav>

        {/* Status footer */}
        <div style={{ padding: collapsed ? '12px 8px' : '12px 20px', borderTop: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}>
          {!collapsed ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', flexShrink: 0, boxShadow: '0 0 6px #4ade80' }}/>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', fontFamily: 'monospace' }}>Sistema operacional</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.2)', fontFamily: 'monospace' }}>{time}</div>
            </div>
          ) : (
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', margin: '0 auto', boxShadow: '0 0 6px #4ade80' }}/>
          )}
        </div>

        {/* Toggle button */}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          position: 'absolute', top: 20, right: -12,
          width: 24, height: 24,
          background: '#1a1f2e',
          border: '1px solid rgba(255,255,255,.1)',
          borderRadius: '50%',
          cursor: 'pointer', outline: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: 'rgba(255,255,255,.5)',
          zIndex: 10, transition: 'all .15s',
        }}>
          {collapsed ? '›' : '‹'}
        </button>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, background: '#f0f2f7' }}>
        
        {/* Top bar */}
        <header style={{
          height: 52, flexShrink: 0,
          background: '#fff',
          borderBottom: '1px solid rgba(0,0,0,.06)',
          display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,.04)',
        }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>BACEN Monitor</span>
            <span style={{ fontSize: 11, color: '#d1d5db' }}>›</span>
            <span style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>
              {NAV_ITEMS.find(n => n.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(n.href))?.label || 'Dashboard'}
            </span>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#f0fdf4', borderRadius: 20, border: '1px solid #bbf7d0' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#16a34a', boxShadow: '0 0 4px #16a34a' }}/>
              <span style={{ fontSize: 10, color: '#15803d', fontWeight: 600, fontFamily: 'monospace' }}>BCB · LIVE</span>
            </div>

            {/* Time */}
            <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace', letterSpacing: '.5px' }}>{time}</div>

            {/* Settings shortcut */}
            <a href="/dashboard/settings" style={{
              width: 32, height: 32, borderRadius: 8,
              background: '#f9fafb', border: '1px solid #e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', fontSize: 14, color: '#6b7280',
              transition: 'all .15s',
            }}>⚙</a>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          {children}
        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,.15); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,.25); }
        nav a:hover { background: rgba(255,255,255,.06) !important; color: rgba(255,255,255,.7) !important; }
      `}</style>
    </div>
  )
}
