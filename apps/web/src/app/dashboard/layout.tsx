'use client'
import { usePathname } from 'next/navigation'

const NAV_GROUPS = [
  {
    label: 'Reportes',
    items: [
      { href: '/dashboard',            icon: '▦',  label: 'Dashboard'       },
      { href: '/dashboard/cadocs',     icon: '◈',  label: 'CADOCs'          },
      { href: '/dashboard/entregas',   icon: '◷',  label: 'Entregas'        },
      { href: '/dashboard/pagamentos', icon: '◈',  label: 'Meios de Pgto'   },
    ],
  },
  {
    label: 'Regulatório',
    items: [
      { href: '/dashboard/normas',     icon: '◉',  label: 'Normas BCB'      },
      { href: '/dashboard/ia',         icon: '◆',  label: 'Análise IA'      },
      { href: '/dashboard/links',      icon: '◎',  label: 'Links Úteis'     },
    ],
  },
  {
    label: 'Plataforma',
    items: [
      { href: '/dashboard/settings',   icon: '◧',  label: 'Configurações'   },
    ],
  },
]

// Flatten for active check
const ALL_NAV = NAV_GROUPS.flatMap(g => g.items)

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <div style={{
      display: 'flex', height: '100vh',
      fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
      background: '#f0f2f5', overflow: 'hidden',
    }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: 216, background: '#0b1120', color: '#fff',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Logo */}
        <div style={{
          padding: '18px 16px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 11,
        }}>
          <div style={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg,#0a7c5c 0%,#0e5c96 100%)',
            borderRadius: 8, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 16, flexShrink: 0,
            boxShadow: '0 2px 8px rgba(10,124,92,0.35)',
          }}>🏦</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.4px', color: '#f1f5f9' }}>
              BACEN Monitor
            </div>
            <div style={{
              fontSize: 9, color: 'rgba(255,255,255,0.3)',
              fontFamily: 'monospace', letterSpacing: '0.05em',
              marginTop: 1,
            }}>
              RegTech Platform v2.0
            </div>
          </div>
        </div>

        {/* Compliance status pill */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'rgba(10,124,92,0.14)',
            border: '1px solid rgba(10,124,92,0.28)',
            borderRadius: 7, padding: '6px 10px',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0, boxShadow: '0 0 5px #22c55e' }} />
            <span style={{ fontSize: 10.5, color: '#86efac', fontWeight: 700 }}>Sistema Operacional</span>
          </div>
        </div>

        {/* Nav groups */}
        <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 6 }}>
              <div style={{
                fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '10px 8px 5px', fontFamily: 'monospace',
              }}>
                {group.label}
              </div>
              {group.items.map(item => {
                const active = isActive(item.href)
                return (
                  <a key={item.href} href={item.href} style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '7px 10px', borderRadius: 7, marginBottom: 1,
                    color: active ? '#f1f5f9' : 'rgba(255,255,255,0.45)',
                    background: active ? 'rgba(10,124,92,0.2)' : 'transparent',
                    textDecoration: 'none', fontSize: 12.5,
                    fontWeight: active ? 700 : 500,
                    borderLeft: active ? '2px solid #22c55e' : '2px solid transparent',
                    transition: 'all .12s',
                  }}>
                    <span style={{ fontSize: 14, opacity: active ? 1 : 0.7 }}>{item.icon}</span>
                    {item.label}
                    {active && (
                      <span style={{
                        marginLeft: 'auto', width: 5, height: 5,
                        borderRadius: '50%', background: '#22c55e',
                      }} />
                    )}
                  </a>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6,
            background: 'rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12,
          }}>🔐</div>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>Compliance Officer</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>BCB · SFN</div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', background: '#f0f2f5',
      }}>
        {/* Top bar */}
        <header style={{
          height: 48, background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center',
          padding: '0 28px', gap: 12, flexShrink: 0,
        }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
            <span style={{ color: '#0a7c5c', fontWeight: 700 }}>RegTech</span>
            <span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#0d1117', fontWeight: 600 }}>
              {ALL_NAV.find(n => isActive(n.href))?.label || 'Dashboard'}
            </span>
          </div>

          <div style={{ flex: 1 }} />

          {/* BCB status indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 20,
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            fontSize: 11, color: '#15803d', fontWeight: 600,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            BCB Online
          </div>

          {/* Date */}
          <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
            {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>

          {/* Settings shortcut */}
          <a href="/dashboard/settings" style={{
            width: 30, height: 30, borderRadius: 7,
            background: '#f1f5f9', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 14, color: '#64748b',
          }}>⚙</a>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
