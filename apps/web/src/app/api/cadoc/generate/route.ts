// apps/web/src/app/api/cadoc/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validate3044 } from '@bacen-monitor/cadoc-engine'
import { CADOC_OP_WEIGHT, PLAN_OPS_INCLUDED } from '@/lib/billing'
import { z } from 'zod'
import type { CadocType } from '@bacen-monitor/types'

const GenerateSchema = z.object({
  cadoc: z.enum(['3040', '3044', '3060', '4010', '6334']),
  input: z.record(z.unknown()),
  options: z.object({
    validate: z.boolean().default(true),
  }).optional(),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()

  // ── Auth ────────────────────────────────────────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse body ──────────────────────────────────────────────
  let body: z.infer<typeof GenerateSchema>
  try {
    body = GenerateSchema.parse(await req.json())
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body', details: e }, { status: 400 })
  }

  const { cadoc, input } = body

  // ── Get tenant ──────────────────────────────────────────────
  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', userData.tenant_id)
    .single()

  if (!tenant || !tenant.is_active) {
    return NextResponse.json({ error: 'Tenant inactive or not found' }, { status: 403 })
  }

  // ── Check permission ────────────────────────────────────────
  if (userData.role === 'viewer') {
    return NextResponse.json({ error: 'Viewers cannot generate CADOCs' }, { status: 403 })
  }

  // ── Check plan: CADOC access ─────────────────────────────────
  const { data: planConfig } = await supabase
    .from('plan_configs')
    .select('max_cadocs')
    .eq('plan', tenant.plan)
    .single()

  if (planConfig?.max_cadocs && !planConfig.max_cadocs.includes(cadoc)) {
    return NextResponse.json({
      error: 'CADOC_NOT_IN_PLAN',
      message: `CADOC ${cadoc} não está disponível no plano ${tenant.plan}. Faça upgrade para Professional.`,
    }, { status: 402 })
  }

  // ── Check usage limit ────────────────────────────────────────
  const period = new Date().toISOString().substring(0, 7)  // "YYYY-MM"
  const { data: usageData } = await supabase
    .from('usage_records')
    .select('n_operacoes')
    .eq('tenant_id', userData.tenant_id)
    .eq('billing_period', period)

  const usedOps = usageData?.reduce((sum, r) => sum + r.n_operacoes, 0) ?? 0
  const opsLimit = PLAN_OPS_INCLUDED[tenant.plan as keyof typeof PLAN_OPS_INCLUDED] ?? 5000
  const isTrial  = tenant.subscription_status === 'trialing'
  const trialLimit = 1000

  if (isTrial && usedOps >= trialLimit) {
    return NextResponse.json({
      error: 'TRIAL_LIMIT_EXCEEDED',
      message: 'Limite de 1.000 operações do trial atingido. Adicione um cartão para continuar.',
      opsUsed: usedOps,
      opsLimit: trialLimit,
    }, { status: 402 })
  }

  // ── Create job record ────────────────────────────────────────
  const { data: job, error: jobError } = await supabase
    .from('cadoc_jobs')
    .insert({
      tenant_id: userData.tenant_id,
      created_by: user.id,
      cadoc,
      cnpj_if: extractCnpj(input, cadoc),
      data_base: extractDataBase(input, cadoc),
      status: 'processing',
      input_json: input,
    })
    .select()
    .single()

  if (jobError || !job) {
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }

  try {
    // ── Validate + Generate ──────────────────────────────────
    const startedAt = Date.now()
    let validationReport = null
    let outputXml = ''
    let nOperacoes = 0
    let nErros = 0
    let nAvisos = 0

    if (cadoc === '3044') {
      const result = validate3044(input as any)
      nErros  = result.erros.length
      nAvisos = result.avisos.length
      nOperacoes = result.meta.nOperacoes
      validationReport = { erros: result.erros, avisos: result.avisos, nErros, nAvisos }
      // Strip _comentario fields from output
      const cleanInput = JSON.parse(JSON.stringify(input))
      if (Array.isArray(cleanInput.operacoes)) {
        cleanInput.operacoes.forEach((op: any) => delete op._comentario)
      }
      outputXml = JSON.stringify(cleanInput, null, 2)
    }
    // TODO: add 3040, 4010, 6334, 3060 generators

    const processingMs = Date.now() - startedAt
    const result_status = nErros > 0 ? 'reprovado' : nAvisos > 0 ? 'com_alertas' : 'aprovado'
    const filename = `cadoc${cadoc}_${extractCnpj(input, cadoc)}_${extractDataBase(input, cadoc).replace(/-/g,'')}.${cadoc === '3044' ? 'json' : 'xml'}`

    // ── Update job ──────────────────────────────────────────
    await supabase.from('cadoc_jobs').update({
      status: 'completed',
      result: result_status,
      n_erros: nErros,
      n_avisos: nAvisos,
      n_operacoes: nOperacoes,
      output_xml: outputXml,
      output_filename: filename,
      validation_report: validationReport,
      started_at: new Date(startedAt).toISOString(),
      completed_at: new Date().toISOString(),
      processing_ms: processingMs,
    }).eq('id', job.id)

    // ── Record usage ────────────────────────────────────────
    if (nOperacoes > 0) {
      await supabase.rpc('record_cadoc_usage', {
        p_tenant_id: userData.tenant_id,
        p_job_id: job.id,
        p_cadoc: cadoc,
        p_n_operacoes: nOperacoes,
      })
    }

    // ── Audit log ───────────────────────────────────────────
    await supabase.from('audit_logs').insert({
      tenant_id: userData.tenant_id,
      user_id: user.id,
      action: 'cadoc.generate',
      resource: cadoc,
      resource_id: job.id,
      metadata: { nErros, nAvisos, nOperacoes, filename, result: result_status },
    })

    return NextResponse.json({
      jobId: job.id,
      cadoc,
      filename,
      nOperacoes,
      validation: validationReport,
      result: result_status,
    })

  } catch (err) {
    // Mark job as failed
    await supabase.from('cadoc_jobs').update({
      status: 'failed',
      result: 'erro_conversao',
    }).eq('id', job.id)

    console.error('CADOC generation error:', err)
    return NextResponse.json({ error: 'Generation failed', details: String(err) }, { status: 500 })
  }
}

// ── Helpers ──────────────────────────────────────────────────
function extractCnpj(input: Record<string, unknown>, cadoc: string): string {
  if (cadoc === '3044') return String((input as any).cnpjIF ?? '?')
  if (cadoc === '4010') return String((input as any).cabecalho?.cnpj ?? '?')
  return String((input as any).cabecalho?.CNPJ ?? '?')
}

function extractDataBase(input: Record<string, unknown>, cadoc: string): string {
  if (cadoc === '3044') return String((input as any).dataHoraRemessa ?? '').substring(0, 10)
  if (cadoc === '4010') return String((input as any).cabecalho?.dataBase ?? '?')
  return String((input as any).cabecalho?.DtBase ?? '?')
}
