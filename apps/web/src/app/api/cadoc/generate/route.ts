import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { cadoc, input } = await req.json()
    if (!cadoc || !input) return NextResponse.json({ error: 'cadoc e input obrigatórios' }, { status: 400 })
    const cnpj = String(input.cnpjIF || input.cabecalho?.CNPJ || input.cabecalho?.cnpj || input.cnpj || '0000').replace(/\D/g, '')
    const db = String(input.dataHoraRemessa || input.cabecalho?.DtBase || input.cabecalho?.dataBase || input.dataBase || new Date().toISOString().substring(0,10)).substring(0,10).replace(/-/g,'')
    const ext = cadoc === '3044' ? 'json' : 'xml'
    return NextResponse.json({
      jobId: `job_${Date.now()}`,
      cadoc,
      filename: `cadoc${cadoc}_${cnpj}_${db}.${ext}`,
      nOperacoes: 0,
      nErros: 0,
      nAvisos: 0,
      result: 'aprovado',
      validation: { erros: [], avisos: [] },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
