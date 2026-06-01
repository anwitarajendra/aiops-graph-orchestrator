import { useState } from 'react'

const SERVICES = [
  { id:'frontend',  name:'frontend-v2',     status:'healthy', uptime:'99.98%', latency:'42ms',  rpm:'12,450', pods:3, version:'v2.4.1', health:200 },
  { id:'order',     name:'order-svc-a1',    status:'anomaly', uptime:'97.12%', latency:'812ms', rpm:'8,231',  pods:2, version:'v1.9.3', health:503 },
  { id:'inventory', name:'inventory-svc',   status:'healthy', uptime:'99.95%', latency:'58ms',  rpm:'5,110',  pods:2, version:'v3.1.0', health:200 },
  { id:'auth',      name:'auth-svc',        status:'healthy', uptime:'99.99%', latency:'28ms',  rpm:'22,300', pods:4, version:'v2.0.7', health:200 },
  { id:'db',        name:'core-db-primary', status:'healthy', uptime:'99.99%', latency:'12ms',  rpm:'—',      pods:1, version:'v14.2',  health:200 },
]

export default function ServicesPage() {
  const [filter, setFilter] = useState('all')

  const filtered = SERVICES.filter(s => filter === 'all' || s.status === filter)

  return (
    <div style={{ padding:24, display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.4px' }}>Services</h1>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>
            {SERVICES.length} services registered in Core Cluster
          </p>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {['all','healthy','anomaly'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:'7px 16px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600,
              border:'1px solid var(--border)', cursor:'pointer', transition:'all .15s',
              background: filter===f ? 'var(--blue)' : 'var(--card-bg)',
              color: filter===f ? '#fff' : 'var(--text-secondary)',
              borderColor: filter===f ? 'var(--blue)' : 'var(--border)',
            }}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border)', background:'var(--bg)' }}>
              {['Service','Status','Health','Latency','RPM','Pods','Version'].map(h => (
                <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id} style={{
                borderBottom: i < filtered.length-1 ? '1px solid var(--border-light)' : 'none',
                background: s.status==='anomaly' ? 'rgba(220,38,38,0.02)' : 'transparent',
                transition:'background .15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = s.status==='anomaly' ? 'rgba(220,38,38,0.05)' : 'var(--bg)'}
                onMouseLeave={e => e.currentTarget.style.background = s.status==='anomaly' ? 'rgba(220,38,38,0.02)' : 'transparent'}
              >
                <td style={{ padding:'12px 16px' }}>
                  <div style={{ fontWeight:600, fontSize:14 }}>{s.name}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)', marginTop:1 }}>{s.id}</div>
                </td>
                <td style={{ padding:'12px 16px' }}>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:6,
                    background: s.status==='anomaly' ? 'var(--red-light)' : 'var(--green-light)',
                    color: s.status==='anomaly' ? 'var(--red)' : 'var(--green)',
                    padding:'3px 10px', borderRadius:99, fontSize:12, fontWeight:600,
                  }}>
                    <div style={{ width:6,height:6,borderRadius:'50%', background: s.status==='anomaly' ? 'var(--red)' : 'var(--green)', animation: s.status==='anomaly' ? 'blink 1.2s ease infinite' : 'none' }}/>
                    {s.status==='anomaly' ? 'Anomaly' : 'Healthy'}
                  </div>
                </td>
                <td style={{ padding:'12px 16px', fontFamily:'var(--font-mono)', fontSize:13,
                  color: s.health >= 400 ? 'var(--red)' : 'var(--green)', fontWeight:700 }}>{s.health}</td>
                <td style={{ padding:'12px 16px', fontFamily:'var(--font-mono)', fontSize:13,
                  color: parseInt(s.latency) > 200 ? 'var(--red)' : 'var(--text-primary)', fontWeight:600 }}>{s.latency}</td>
                <td style={{ padding:'12px 16px', fontFamily:'var(--font-mono)', fontSize:13, color:'var(--text-primary)' }}>{s.rpm}</td>
                <td style={{ padding:'12px 16px', fontFamily:'var(--font-mono)', fontSize:13, color:'var(--text-primary)' }}>{s.pods}</td>
                <td style={{ padding:'12px 16px', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-muted)' }}>{s.version}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
