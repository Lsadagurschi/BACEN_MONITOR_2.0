'use client'
export default function CadocsPage() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <iframe
        src="/bacen-monitor-app.html"
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
        title="BACEN Monitor — CADOCs"
      />
    </div>
  )
}
