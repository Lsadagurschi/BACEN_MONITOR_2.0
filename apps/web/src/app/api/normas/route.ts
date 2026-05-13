import { NextRequest, NextResponse } from 'next/server'

// Mapeamento de IDs para URLs reais
const FEED_URLS: Record<string, string> = {
  bcb_normativos:   'https://www.bcb.gov.br/api/feed/app/normativos/normativos',
  bcb_demais:       'https://www.bcb.gov.br/api/feed/app/normativos/demaisnormativos',
  bcb_cartas:       'https://www.bcb.gov.br/api/feed/app/normativos/cartascirculares',
  cvm:              'https://www.gov.br/cvm/pt-br/assuntos/noticias/RSS',
  susep:            'https://www.gov.br/susep/pt-br/assuntos/noticias/RSS',
  senado:           'https://www25.senado.leg.br/web/atividade/materias/-/materia/rss/atualNormas',
  dou_s1:           'https://www.in.gov.br/servicos/dou-consumidor/filtrar',
}

// Headers que simulam navegador — necessários para BCB não retornar 403
const BROWSER_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':          'application/atom+xml,application/xml,text/xml,application/rss+xml,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  'Cache-Control':   'no-cache',
  'Referer':         'https://www.bcb.gov.br/',
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const feedId = searchParams.get('feed') || ''
  const ano    = searchParams.get('ano')  || String(new Date().getFullYear())

  if (!feedId || !FEED_URLS[feedId]) {
    return NextResponse.json({ error: 'Feed inválido', feeds: Object.keys(FEED_URLS) }, { status: 400 })
  }

  const baseUrl = FEED_URLS[feedId]

  // Para feeds que suportam filtro por ano
  const SUPORTA_ANO = ['bcb_normativos', 'bcb_demais', 'bcb_cartas']
  const url = SUPORTA_ANO.includes(feedId)
    ? `${baseUrl}?ano=${ano}`
    : feedId === 'dou_s1'
      ? `${baseUrl}?termo=banco+central+resolucao&secao=DO1&tipoAto=RESOLUCAO,INSTRUCAO_NORMATIVA,CIRCULAR&formato=JSON`
      : baseUrl

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000)

    const response = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal:  controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return NextResponse.json(
        { error: `Fonte retornou ${response.status}`, url },
        { status: 502 }
      )
    }

    const contentType = response.headers.get('content-type') || ''
    const body = await response.text()

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type':                contentType || 'application/xml',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control':               'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    })
  } catch (err: any) {
    const msg = err?.name === 'AbortError' ? 'Timeout ao buscar feed' : err?.message || 'Erro desconhecido'
    return NextResponse.json({ error: msg, url }, { status: 504 })
  }
}
