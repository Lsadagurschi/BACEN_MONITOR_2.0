'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [sent, setSent] = useState(false)
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f3ee',fontFamily:'Arial,sans-serif'}}>
      <div style={{background:'#fff',border:'1px solid #d1c9b8',borderRadius:16,padding:'48px 40px',width:400,boxShadow:'0 20px 60px rgba(10,15,30,0.08)',textAlign:'center'}}>
        <div style={{width:48,height:48,background:'linear-gradient(135deg,#0a7c5c,#1d5fcc)',borderRadius:12,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:24,marginBottom:12}}>🏦</div>
        <div style={{fontSize:20,fontWeight:800,color:'#0a0f1e',marginBottom:4}}>BACEN Monitor</div>
        <div style={{fontSize:13,color:'#6b7280',marginBottom:32}}>Conformidade regulatória para IFs</div>
        <a href="/dashboard" style={{display:'block',padding:'13px',background:'#0a0f1e',color:'#fff',borderRadius:8,fontSize:14,fontWeight:700,textDecoration:'none'}}>
          Acessar Plataforma →
        </a>
        <p style={{fontSize:11,color:'#9ca3af',marginTop:16}}>Autenticação completa em breve</p>
      </div>
    </div>
  )
}
