'use client'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const nav = [
    { href: '/dashboard',          icon: '📊', label: 'Dashboard'     },
    { href: '/dashboard/cadocs',   icon: '⚙️',  label: 'CADOCs'        },
    { href: '/dashboard/entregas', icon: '📅', label: 'Entregas'      },
    { href: '/dashboard/settings', icon: '🔧', label: 'Configurações' },
  ]
  // On the CADOCs page, give full height to the iframe
  const isCadocs = pathname.startsWith('/dashboard/cadocs')

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif', background: '#f5f3ee', overflow: 'hidden' }}>
      <aside style={{ width: 200, background: '#0a0f1e', color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#0a7c5c,#1d5fcc)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🏦</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.3px' }}>BACEN Monitor</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>v2.0 SaaS</div>
          </div>
        </div>
        <nav style={{ padding: '10px 8px', flex: 1 }}>
          {nav.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <a key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 10px', borderRadius: 7, marginBottom: 2,
                color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                textDecoration: 'none', fontSize: 12.5, fontWeight: active ? 700 : 500,
                borderLeft: active ? '2px solid #c8922a' : '2px solid transparent',
                transition: 'all .15s'
              }}>
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                {item.label}
              </a>
            )
          })}
        </nav>
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
          BACEN Monitor SaaS
        </div>
      </aside>
      <main style={{
        flex: 1,
        overflow: isCadocs ? 'hidden' : 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {children}
      </main>
    </div>
  )
}
