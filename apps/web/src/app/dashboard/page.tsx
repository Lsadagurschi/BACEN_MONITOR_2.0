'use client'
import { useState, useEffect } from 'react'

const CADOC_ITEMS = [
  {cod:'3040',nome:'SCR Crédito',per:'Mensal',dias:5,area:'crédito'},
  {cod:'3044',nome:'SCR Eventos',per:'Por evento',dias:2,area:'crédito'},
  {cod:'3060',nome:'SCR Taxas',per:'Semanal',dias:5,area:'crédito'},
  {cod:'4010',nome:'COSIF',per:'Mensal',dias:9,area:'contabilidade'},
  {cod:'6334',nome:'Cartões',per:'Trimestral',dias:67,area:'pagamentos'},
]

const NORMAS_URGENTES = [
  {titulo:'Res. BCB 403/2025 — CADOC 3044 Fase 2',urgencia:'critica',prazo:'Mai/2026',area:'SCR'},
  {titulo:'Res. BCB 522/2025 — Subcredenciadores',urgencia:'critica',prazo:'Dez/2026',area:'SPB'},
  {titulo:'Res. BCB 411/2025 — Pix Parcelado',urgencia:'alta',prazo:'Fev/2026',area:'Pix'},
  {titulo:'IN BCB 510/2025 — Open Finance Fase 4',urgencia:'alta',prazo:'Jan/2026',area:'Open Finance'},
]

const ATIVIDADES = [
  {ts:'Hoje 14:32',acao:'CADOC 3044 gerado e validado',status:'APROVADO',cadoc:'3044',user:'Sistema'},
  {ts:'Hoje 11:15',acao:'Norma Res. BCB 403/2025 analisada por IA',status:'REVISADO',cadoc:'N/A',user:'IA'},
  {ts:'Ontem 16:48',acao:'CADOC 4010 exportado — COSIF jan/2026',status:'EXPORTADO',cadoc:'4010',user:'Sistema'},
  {ts:'Ontem 09:22',acao:'Feed BCB atualizado — 12 normas carregadas',status:'ATUALIZADO',cadoc:'N/A',user:'Feed'},
]

export default function DashboardPage() {
  const [nome, setNome] = useState('Sua Instituição')
  const [tipo, setTipo] = useState('')
  const [seg, setSeg] = useState('')
  const now = new Date()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNome(localStorage.getItem('bm_nome') || 'Sua Instituição')
      setTipo(localStorage.getItem('bm_tipo') || '')
      setSeg(localStorage.getItem('bm_segmento') || '')
    }
  }, [])

  const calcDias = (d: number) => {
    const prazo = new Date(now.getFullYear(), now.getMonth() + 1, d)
    return Math.ceil((prazo.getTime() - now.getTime()) / 86400000)
  }

  const diasArr = CADOC_ITEMS.map(c => calcDias(c.dias))
  const vencidos = diasArr.filter(d => d < 0).length
  const urgentes = diasArr.filter(d => d >= 0 && d <= 7).length
  const score = Math.round(((CADOC_ITEMS.length - vencidos) / CADOC_ITEMS.length) * 100)
  const semaforo = vencidos > 0 ? 'critico' : urgentes > 0 ? 'atencao' : 'ok'

  const stColor = semaforo === 'critico' ? '#dc2626' : semaforo === 'atencao' ? '#d97706' : '#16a34a'
  const stLabel = semaforo === 'critico' ? 'CRÍTICO' : semaforo === 'atencao' ? 'ATENÇÃO' : 'CONFORME'
  const stBg = semaforo === 'critico' ? '#fef2f2' : semaforo === 'atencao' ? '#fffbeb' : '#f0fdf4'

  const dayOfWeek = now.toLocaleDateString('pt-BR', { weekday: 'long' })
  const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  const sectionTitle = (t: string, sub?: string) => (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-.3px' }}>{t}</h2>
      {sub && <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>{sub}</p>}
    </div>
  )

  const Card = ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,.07)', boxShadow: '0 1px 3px rgba(0,0,0,.05)', ...style }}>
      {children}
    </div>
  )

  return (
    <div style={{ padding: '24px 28px', minHeight: '100%', background: '#f0f2f7' }}>
      
      {/* ── WELCOME HEADER ── */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 4px', letterSpacing: '-.5px' }}>
            Bom {now.getHours() < 12 ? 'dia' : now.getHours() < 18 ? 'tarde' : 'noite'}, {nome.split(' ')[0] || 'Usuário'}
          </h1>
          <p style={{ fontSize: 12.5, color: '#6b7280', margin: 0 }}>
            {dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)}, {dateStr} · Regulação BCB/CMN em tempo real
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/dashboard/cadocs" style={{
            padding: '9px 18px', borderRadius: 8, textDecoration: 'none',
            background: 'linear-gradient(135deg,#1a6b52,#0d4c8f)',
            color: '#fff', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 14px rgba(26,107,82,.3)',
          }}>◎ Gerar CADOC</a>
          <a href="/dashboard/normas" style={{
            padding: '9px 18px', borderRadius: 8, textDecoration: 'none',
            background: '#fff', border: '1px solid #e5e7eb',
            color: '#374151', fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>⊞ Ver Normas</a>
        </div>
      </div>

      {/* ── KPI STRIP ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { l: 'Status Geral', v: stLabel, c: stColor, bg: stBg, icon: '◈', link: '/dashboard/entregas' },
          { l: 'Score Compliance', v: score + '%', c: score >= 90 ? '#16a34a' : score >= 70 ? '#d97706' : '#dc2626', bg: '#f9fafb', icon: '◎', link: '/dashboard/entregas' },
          { l: 'CADOCs Monitorados', v: String(CADOC_ITEMS.length), c: '#1d4ed8', bg: '#eff6ff', icon: '⬡', link: '/dashboard/entregas' },
          { l: 'Normas Críticas', v: '2', c: '#dc2626', bg: '#fef2f2', icon: '⊞', link: '/dashboard/normas' },
          { l: 'Urgentes ≤7d', v: String(urgentes), c: urgentes > 0 ? '#d97706' : '#16a34a', bg: urgentes > 0 ? '#fffbeb' : '#f0fdf4', icon: '◷', link: '/dashboard/entregas' },
        ].map(k => (
          <a key={k.l} href={k.link} style={{ textDecoration: 'none' }}>
            <div style={{
              background: k.bg, borderRadius: 12, padding: '16px 18px',
              border: `1px solid ${k.c}22`,
              transition: 'transform .15s, box-shadow .15s',
              cursor: 'pointer',
            }}>
              <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 8 }}>{k.l}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: k.c, fontFamily: 'monospace', letterSpacing: '-1px', lineHeight: 1 }}>{k.v}</div>
            </div>
          </a>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* ── VENCIMENTOS ── */}
        <Card>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>⏰ Próximos Vencimentos</div>
              <div style={{ fontSize: 10.5, color: '#9ca3af', marginTop: 1 }}>Calendário regulatório BCB</div>
            </div>
            <a href="/dashboard/entregas" style={{ fontSize: 11, color: '#1a6b52', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</a>
          </div>
          <div>
            {CADOC_ITEMS.map((c, i) => {
              const dias = calcDias(c.dias)
              const color = dias < 0 ? '#dc2626' : dias <= 7 ? '#d97706' : dias <= 30 ? '#0891b2' : '#16a34a'
              const bg = dias < 0 ? '#fef2f2' : dias <= 7 ? '#fffbeb' : '#f9fafb'
              return (
                <div key={c.cod} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 18px',
                  borderBottom: i < CADOC_ITEMS.length - 1 ? '1px solid #f9fafb' : 'none',
                  borderLeft: `3px solid ${color}`,
                  background: i % 2 === 0 ? '#fff' : '#fafafa',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: color + '15', border: `1px solid ${color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, color, fontFamily: 'monospace',
                    flexShrink: 0,
                  }}>{c.cod}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{c.nome}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1, fontFamily: 'monospace' }}>{c.per}</div>
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                    background: bg, color, border: `1px solid ${color}30`,
                    fontFamily: 'monospace', whiteSpace: 'nowrap',
                  }}>
                    {dias < 0 ? Math.abs(dias) + 'd atraso' : '+' + dias + 'd'}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* ── NORMAS CRÍTICAS ── */}
        <Card>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>⚠️ Normas com Impacto Imediato</div>
              <div style={{ fontSize: 10.5, color: '#9ca3af', marginTop: 1 }}>Normas BCB/CMN vigentes que exigem ação</div>
            </div>
            <a href="/dashboard/normas" style={{ fontSize: 11, color: '#1a6b52', textDecoration: 'none', fontWeight: 600 }}>Feed →</a>
          </div>
          <div>
            {NORMAS_URGENTES.map((n, i) => {
              const uc = n.urgencia === 'critica' ? '#dc2626' : '#d97706'
              return (
                <div key={i} style={{
                  padding: '12px 18px',
                  borderBottom: i < NORMAS_URGENTES.length - 1 ? '1px solid #f9fafb' : 'none',
                  borderLeft: `3px solid ${uc}`,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', lineHeight: 1.4, marginBottom: 6 }}>{n.titulo}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: uc + '15', color: uc, fontFamily: 'monospace', border: `1px solid ${uc}30` }}>
                      {n.urgencia.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 9.5, padding: '2px 7px', borderRadius: 4, background: '#f3f4f6', color: '#6b7280', fontWeight: 500 }}>{n.area}</span>
                    <span style={{ fontSize: 9.5, color: '#9ca3af', marginLeft: 'auto', fontFamily: 'monospace' }}>⏱ {n.prazo}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* ── SCORE BAR ── */}
        <Card>
          <div style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 14 }}>📊 Score de Compliance</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                background: `conic-gradient(${stColor} ${score * 3.6}deg, #f3f4f6 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: stColor, fontFamily: 'monospace' }}>{score}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: stColor, fontFamily: 'monospace', letterSpacing: '-1px' }}>{score}%</div>
                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>Score regulatório</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: stColor, marginTop: 4 }}>{stLabel}</div>
              </div>
            </div>
            <div style={{ height: 6, background: '#f3f4f6', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: score + '%', background: `linear-gradient(90deg,${stColor},${stColor}99)`, borderRadius: 6, transition: 'width .5s' }}/>
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 8 }}>
              {CADOC_ITEMS.length - vencidos} de {CADOC_ITEMS.length} CADOCs em conformidade
            </div>
          </div>
        </Card>

        {/* ── ARQUITETURA ── */}
        <Card>
          <div style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 14 }}>🏗️ Camadas RegTech</div>
            {[
              { l: 'Interface', items: ['Dashboard','Relatórios','Auditoria'], c: '#dc2626' },
              { l: 'Orquestração', items: ['Workflow','Prazos','Notificações'], c: '#9b1c1c' },
              { l: 'Validação', items: ['XML BCB','Regras BCB','Reconciliação'], c: '#1e3a8a' },
              { l: 'Integração', items: ['STA BCB','SCR JSON','Core Banking'], c: '#111827' },
            ].map((layer, i) => (
              <div key={layer.l} style={{ marginBottom: i < 3 ? 8 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: layer.c, flexShrink: 0 }}/>
                  <span style={{ fontSize: 10, fontWeight: 700, color: layer.c, letterSpacing: '.5px', textTransform: 'uppercase' }}>{layer.l}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, paddingLeft: 16, flexWrap: 'wrap' }}>
                  {layer.items.map(it => (
                    <span key={it} style={{ fontSize: 9.5, padding: '2px 7px', borderRadius: 4, background: layer.c + '10', color: layer.c, fontWeight: 500, border: `1px solid ${layer.c}20` }}>{it}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── ACESSO RÁPIDO ── */}
        <Card>
          <div style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 14 }}>⚡ Acesso Rápido</div>
            {[
              { icon: '◎', l: 'Gerar CADOC 3044', href: '/dashboard/cadocs', c: '#7c3aed' },
              { icon: '◎', l: 'Gerar CADOC 3040', href: '/dashboard/cadocs', c: '#1d4ed8' },
              { icon: '⊞', l: 'Feed de Normas BCB', href: '/dashboard/normas', c: '#1a6b52' },
              { icon: '◷', l: 'Calendário Entregas', href: '/dashboard/entregas', c: '#0891b2' },
              { icon: '⬡', l: 'CADOC por IF', href: '/dashboard/pagamentos', c: '#d97706' },
              { icon: '◈', l: 'Configurar Instituição', href: '/dashboard/settings', c: '#6b7280' },
            ].map(item => (
              <a key={item.l} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 7, textDecoration: 'none',
                color: '#374151', marginBottom: 4,
                transition: 'background .12s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f9fafb'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <span style={{ fontSize: 14, color: item.c, width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{item.l}</span>
                <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>→</span>
              </a>
            ))}
          </div>
        </Card>
      </div>

      {/* ── ATIVIDADES RECENTES ── */}
      <Card>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>🔍 Atividades Recentes</div>
            <div style={{ fontSize: 10.5, color: '#9ca3af', marginTop: 1 }}>Trilha de auditoria — últimas ações</div>
          </div>
          <a href="/dashboard/cadocs" style={{ fontSize: 11, color: '#1a6b52', textDecoration: 'none', fontWeight: 600 }}>Gerar CADOC →</a>
        </div>
        <div style={{ padding: '4px 0' }}>
          {ATIVIDADES.map((a, i) => {
            const sc = a.status === 'APROVADO' ? '#16a34a' : a.status === 'EXPORTADO' ? '#1d4ed8' : a.status === 'REVISADO' ? '#7c3aed' : '#d97706'
            const sb = a.status === 'APROVADO' ? '#f0fdf4' : a.status === 'EXPORTADO' ? '#eff6ff' : a.status === 'REVISADO' ? '#faf5ff' : '#fffbeb'
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px',
                borderBottom: i < ATIVIDADES.length - 1 ? '1px solid #f9fafb' : 'none',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc, flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{a.acao}</div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{a.ts}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: sb, color: sc, fontFamily: 'monospace', border: `1px solid ${sc}25`, whiteSpace: 'nowrap' }}>{a.status}</span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}
