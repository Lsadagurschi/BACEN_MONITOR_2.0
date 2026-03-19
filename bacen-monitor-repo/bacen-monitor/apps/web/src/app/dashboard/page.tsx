// apps/web/src/app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, role, full_name')
    .single()

  const tenantId = userData?.tenant_id

  // Busca jobs recentes
  const { data: recentJobs } = tenantId ? await supabase
    .from('cadoc_jobs')
    .select('id, cadoc, status, result, n_erros, n_avisos, n_operacoes, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(5) : { data: [] }

  // Busca próximos vencimentos
  const { data: schedules } = tenantId ? await supabase
    .from('delivery_schedules_view')
    .select('cadoc, periodo_ref, prazo, dias_restantes, entregue')
    .eq('tenant_id', tenantId)
    .order('prazo', { ascending: true })
    .limit(8) : { data: [] }

  const vencidos  = schedules?.filter(s => s.dias_restantes < 0 && !s.entregue).length ?? 0
  const urgentes  = schedules?.filter(s => s.dias_restantes >= 0 && s.dias_restantes <= 7 && !s.entregue).length ?? 0

  return (
    <div style={{ padding: '32px 36px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0a0f1e', marginBottom: 8 }}>
        Dashboard Executivo
      </h1>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 32 }}>
        Visão geral da conformidade regulatória
      </p>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Status', value: vencidos > 0 ? '🔴 CRÍTICO' : urgentes > 0 ? '🟡 ATENÇÃO' : '🟢 OK', color: vencidos > 0 ? '#ef4444' : urgentes > 0 ? '#f59e0b' : '#22c55e' },
          { label: 'Vencidos', value: String(vencidos), color: vencidos > 0 ? '#ef4444' : '#22c55e' },
          { label: 'Urgentes ≤7d', value: String(urgentes), color: urgentes > 0 ? '#f59e0b' : '#22c55e' },
          { label: 'Jobs este mês', value: String(recentJobs?.length ?? 0), color: '#0891b2' },
        ].map(kpi => (
          <div key={kpi.label} style={{
            background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12,
            padding: '20px', borderTop: `3px solid ${kpi.color}`
          }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: kpi.color, fontFamily: 'Courier New' }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Jobs recentes */}
      <div style={{ background: '#fff', border: '1px solid #d1c9b8', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #d1c9b8', fontSize: 13, fontWeight: 700, color: '#0a0f1e' }}>
          Últimos jobs de geração
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9f7f4' }}>
              {['CADOC', 'Status', 'Erros', 'Avisos', 'Operações', 'Data'].map(h => (
                <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11,
                  fontWeight: 600, color: '#6b7280', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(recentJobs ?? []).length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                Nenhum job ainda. Use a aba CADOCs para gerar seu primeiro arquivo.
              </td></tr>
            ) : recentJobs!.map(job => (
              <tr key={job.id} style={{ borderTop: '1px solid #f0ede8' }}>
                <td style={{ padding: '10px 16px', fontWeight: 700, color: '#0a0f1e', fontFamily: 'Courier New' }}>{job.cadoc}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                    background: job.result === 'aprovado' ? '#f0fdf4' : job.result === 'com_alertas' ? '#fffbeb' : '#fef2f2',
                    color: job.result === 'aprovado' ? '#166534' : job.result === 'com_alertas' ? '#92400e' : '#991b1b'
                  }}>{(job.result ?? job.status).toUpperCase()}</span>
                </td>
                <td style={{ padding: '10px 16px', color: job.n_erros > 0 ? '#ef4444' : '#9ca3af', fontFamily: 'Courier New' }}>
                  {job.n_erros > 0 ? `❌ ${job.n_erros}` : '—'}
                </td>
                <td style={{ padding: '10px 16px', color: job.n_avisos > 0 ? '#f59e0b' : '#9ca3af', fontFamily: 'Courier New' }}>
                  {job.n_avisos > 0 ? `⚠ ${job.n_avisos}` : '—'}
                </td>
                <td style={{ padding: '10px 16px', fontFamily: 'Courier New', color: '#374151' }}>{job.n_operacoes}</td>
                <td style={{ padding: '10px 16px', color: '#9ca3af', fontSize: 12 }}>
                  {new Date(job.created_at).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
