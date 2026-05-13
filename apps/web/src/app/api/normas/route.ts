import { NextRequest, NextResponse } from 'next/server'

const FEED_URLS: Record<string, string> = {
  bcb_normativos: 'https://www.bcb.gov.br/api/feed/app/normativos/normativos',
  bcb_demais:     'https://www.bcb.gov.br/api/feed/app/normativos/demaisnormativos',
  bcb_cartas:     'https://www.bcb.gov.br/api/feed/app/normativos/cartascirculares',
  cvm:            'https://www.gov.br/cvm/pt-br/assuntos/noticias/RSS',
  susep:          'https://www.gov.br/susep/pt-br/assuntos/noticias/RSS',
  senado:         'https://www25.senado.leg.br/web/atividade/materias/-/materia/rss/atualNormas',
}

const BCB_FEEDS = ['bcb_normativos', 'bcb_demais', 'bcb_cartas']

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
  const ano    = searchParams.get('ano')  || '2026'
  const mes    = searchParams.get('mes')  || ''

  if (!feedId || !FEED_URLS[feedId]) {
    return NextResponse.json({ error: 'Feed inválido' }, { status: 400 })
  }

  const base = FEED_URLS[feedId]
  let url = base
  if (BCB_FEEDS.includes(feedId)) {
    url = mes ? `${base}?ano=${ano}&mes=${mes}` : `${base}?ano=${ano}`
  }

  try {
    const ctrl = new AbortController()
    const to   = setTimeout(() => ctrl.abort(), 20000)
    const r    = await fetch(url, { headers: BROWSER_HEADERS, signal: ctrl.signal })
    clearTimeout(to)

    if (!r.ok) return NextResponse.json({ error: `HTTP ${r.status}`, url }, { status: 502 })

    const ct   = r.headers.get('content-type') || 'application/xml'
    const body = await r.text()

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type':                ct,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control':               'public, s-maxage=1800',
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.name === 'AbortError' ? 'Timeout' : (err?.message || 'Erro'), url },
      { status: 504 }
    )
  }
}
