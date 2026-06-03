import { useState, useEffect, useRef } from 'react'

const BASE_LOGS = [
  {time:'14:00:01',level:'INFO',svc:'frontend-v2',msg:'Health check OK: 200'},
  {time:'14:01:15',level:'INFO',svc:'auth-svc',msg:'Token refresh batch: 2048 sessions renewed'},
  {time:'14:02:11',level:'INFO',svc:'frontend-v2',msg:'Service reported health check: 200 OK'},
  {time:'14:03:44',level:'WARN',svc:'order-svc',msg:'Response time elevated: p95=620ms'},
  {time:'14:04:10',level:'INFO',svc:'inventory-svc',msg:'Cache warm-up complete: 8,200 records'},
  {time:'14:05:45',level:'CRIT',svc:'order-svc',msg:'Node order-svc-a1: Memory threshold exceeded (92%)'},
  {time:'14:06:02',level:'ACTN',svc:'k8s-scheduler',msg:'Triggering automated restart: order-svc-a1'},
  {time:'14:06:15',level:'INFO',svc:'k8s-scheduler',msg:'Pod order-svc-a1-restart pending allocation'},
  {time:'14:07:01',level:'INFO',svc:'inventory-svc',msg:'Syncing inventory state with core-db-primary'},
  {time:'14:07:33',level:'WARN',svc:'order-svc',msg:'Latency spike: p99 > 800ms'},
]

const STREAM = [
  {level:'INFO',svc:'frontend-v2',msg:'Heartbeat: 200 OK'},
  {level:'WARN',svc:'order-svc',msg:'CPU still elevated: 91%'},
  {level:'INFO',svc:'core-db',msg:'Replica lag: 12ms — within threshold'},
  {level:'ACTN',svc:'k8s-scheduler',msg:'Auto-scaling: order-svc replicas → 3'},
  {level:'INFO',svc:'auth-svc',msg:'Issued 144 tokens in last 60s'},
]

const COLORS = { CRIT:'var(--red)', WARN:'var(--amber)', ACTN:'var(--amber)', INFO:'var(--blue)', DEBUG:'var(--text-muted)' }
const BG = { CRIT:'var(--red-light)', WARN:'var(--amber-light)', ACTN:'var(--amber-light)', INFO:'var(--blue-light)', DEBUG:'var(--bg)' }

export default function LogsPage() {
  const [logs, setLogs] = useState(BASE_LOGS)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const ref = useRef(null)
  let idx = 0

  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date()
      const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
      setLogs(prev => [...prev.slice(-80), { time:ts, ...STREAM[idx++ % STREAM.length] }])
    }, 2500)
    return () => clearInterval(t)
  }, [])

  useEffect(() => { if(ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [logs])

  const displayed = logs.filter(l =>
    (filter === 'ALL' || l.level === filter) &&
    (!search || l.msg.toLowerCase().includes(search.toLowerCase()) || l.svc.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div style={{ padding:24, display:'flex', flexDirection:'column', gap:16, height:'calc(100vh - var(--header-h))', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.4px' }}>Logs</h1>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>Live streaming cluster action log</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{
            display:'flex', alignItems:'center', gap:8, background:'var(--card-bg)',
            border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'0 12px', height:34,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filter logs..."
              style={{ border:'none', outline:'none', fontSize:13, background:'none', width:140, color:'var(--text-primary)' }}/>
          </div>
          {['ALL','CRIT','WARN','INFO','ACTN'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:'5px 12px', borderRadius:'var(--radius-sm)', fontSize:12, fontFamily:'var(--font-mono)', fontWeight:700,
              border:`1px solid ${filter===f ? COLORS[f] || 'var(--blue)' : 'var(--border)'}`,
              background: filter===f ? (BG[f] || 'var(--blue-light)') : 'var(--card-bg)',
              color: filter===f ? (COLORS[f] || 'var(--blue)') : 'var(--text-muted)',
              cursor:'pointer',
            }}>{f}</button>
          ))}
        </div>
      </div>

      <div ref={ref} style={{
        flex:1, overflowY:'auto', background:'#0f172a', borderRadius:'var(--radius)',
        fontFamily:'var(--font-mono)', fontSize:12, border:'1px solid #1e293b',
      }}>
        <div style={{ padding:'8px 0' }}>
          {displayed.map((log, i) => (
            <div key={i} style={{
              display:'flex', gap:16, padding:'5px 18px', alignItems:'baseline',
              background: i===displayed.length-1 ? 'rgba(255,255,255,0.03)' : 'transparent',
              borderLeft: log.level==='CRIT' ? '2px solid #dc2626' : '2px solid transparent',
              animation: i===displayed.length-1 ? 'slide-in .18s ease' : 'none',
            }}>
              <span style={{ color:'#475569', flexShrink:0, fontSize:11 }}>{log.time}</span>
              <span style={{ flexShrink:0, padding:'1px 6px', borderRadius:3, fontSize:10, fontWeight:700,
                background: log.level==='CRIT'?'rgba(220,38,38,0.2)':log.level==='WARN'||log.level==='ACTN'?'rgba(217,119,6,0.2)':'rgba(37,99,235,0.2)',
                color: log.level==='CRIT'?'#f87171':log.level==='WARN'||log.level==='ACTN'?'#fbbf24':'#93c5fd',
              }}>{log.level}</span>
              <span style={{ color:'#64748b', flexShrink:0, fontSize:11 }}>{log.svc}</span>
              <span style={{ color: log.level==='CRIT'?'#fca5a5':log.level==='WARN'?'#fde68a':'#e2e8f0', fontWeight: log.level==='CRIT'?600:400 }}>{log.msg}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ width:6,height:6,borderRadius:'50%',background:'var(--green)',animation:'blink 1.8s ease infinite' }}/>
        <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>
          {displayed.length} entries — streaming live
        </span>
      </div>
    </div>
  )
}
