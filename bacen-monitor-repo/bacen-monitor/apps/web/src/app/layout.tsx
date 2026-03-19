// apps/web/src/app/layout.tsx
import type { Metadata } from 'next'
import { DM_Mono, Syne } from 'next/font/google'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '600', '700', '800'],
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'BACEN Monitor — Conformidade Regulatória para IFs',
  description: 'Geração, validação e gestão de CADOCs regulatórios do Banco Central do Brasil',
  keywords: ['BACEN', 'CADOC', 'SCR', 'COSIF', 'compliance', 'RegTech', 'Banco Central'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${syne.variable} ${dmMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
