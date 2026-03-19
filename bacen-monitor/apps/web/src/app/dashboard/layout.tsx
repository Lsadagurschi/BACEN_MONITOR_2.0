export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:'Arial, sans-serif', background:'#f5f3ee' }}>
      <aside style={{ width:220, background:'#0a0f1e', color:'#fff', display:'flex', flexDirection:'column', padding:'24px 0' }}>
        <div style={{ padding:'0 20px 24px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, background:'#c8922a', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🏦</div>
          <div style={{ fontSize:13, fontWeight:800, color:'#fff' }}>BACEN Monitor</div>
        </div>
        <nav style={{ padding:'16px 12px', flex:1 }}>
          {([
            ['/dashboard', '📊', 'Dashboard'],
            ['/dashboard/cadocs', '⚙️', 'CADOCs'],
            ['/dashboard/entregas', '📅', 'Entregas'],
          ] as [string,string,string][]).map(([href,icon,label]) => (
            <a key={href} href={href} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, marginBottom:2, color:'rgba(255,255,255,0.6)', textDecoration:'none', fontSize:13, fontWeight:600 }}>
              <span>{icon}</span>{label}
            </a>
          ))}
        </nav>
      </aside>
      <main style={{ flex:1, overflow:'auto' }}>{children}</main>
    </div>
  )
}
