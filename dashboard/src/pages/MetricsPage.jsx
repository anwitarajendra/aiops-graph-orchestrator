import { useState, useEffect } from 'react'

function Sparkline({ data, color, height=48 }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 200, h = height
  const pts = data.map((v,i) => `${(i/(data.length-1))*w},${h - ((v-min)/range)*(h-6) - 3}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width:'100%', height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline fill={`url(#g-${color.replace('#','')})`} stroke="none"
        points={`0,${h} ${pts} ${w},${h}`} />
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"
        points={pts} />
    </svg>
  )
}

function useSparkData(base, variance=15, len=20) {
  const [data, setData] = useState(() => Array.from({length:len}, () => base + (Math.random()-0.5)*variance))
  useEffect(() => {
    const t = setInterval(() => {
      setData(prev => [...prev.slice(1), Math.max(0, Math.min(100, base + (Math.random()-0.5)*variance))])
    }, 2000)
    return () => clearInterval(t)
  }, [base, variance])
  return data
}

function MetricCard({ title, value, unit, sub, color, base, variance }) {
  const data = useSparkData(base, variance)
  return (
    <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'18px 20px', boxShadow:'var(--shadow)', flex:1, minWidth:180 }}>
      <div style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>{title}</div>
      <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
        <span style={{ fontSize:32, fontWeight:700, fontFamily:'var(--font-mono)', color }}>{value}</span>
        <span style={{ fontSize:13, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{unit}</span>
      </div>
      <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{sub}</div>
      <div style={{ marginTop:10 }}>
        <Sparkline data={data} color={color} />
      </div>
    </div>
  )
}

export default function MetricsPage() {
  return (
    <div style={{ padding:24, display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.4px' }}>Metrics</h1>
        <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>Real-time cluster performance — auto-refreshing every 2s</p>
      </div>

      <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
        <MetricCard title="Cluster CPU" value="38" unit="%" sub="avg across 5 nodes" color="#2563eb" base={38} variance={12} />
        <MetricCard title="Cluster Memory" value="7.1" unit="GB" sub="of 16GB total" color="#7c3aed" base={71} variance={8} />
        <MetricCard title="Total RPM" value="48K" unit="req/min" sub="across all services" color="#16a34a" base={60} variance={20} />
        <MetricCard title="Avg Latency" value="236" unit="ms" sub="p99 across cluster" color="#d97706" base={50} variance={30} />
        <MetricCard title="Error Rate" value="2.1" unit="%" sub="order-svc elevated" color="#dc2626" base={20} variance={10} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {[
          { name:'FRONTEND-NODE', cpu:12, mem:30, color:'var(--blue)' },
          { name:'ORDER-NODE',    cpu:94, mem:80, color:'var(--red)' },
          { name:'INV-NODE',      cpu:8,  mem:27, color:'var(--blue)' },
          { name:'AUTH-NODE',     cpu:15, mem:20, color:'var(--blue)' },
        ].map(node => (
          <div key={node.name} style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'16px 20px', boxShadow:'var(--shadow)' }}>
            <div style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text-muted)', fontWeight:600, marginBottom:14 }}>{node.name}</div>
            {[['CPU', node.cpu], ['MEM', node.mem]].map(([label, val]) => (
              <div key={label} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{label}</span>
                  <span style={{ fontSize:12, fontFamily:'var(--font-mono)', fontWeight:700,
                    color: val > 80 ? 'var(--red)' : 'var(--text-primary)' }}>{val}%</span>
                </div>
                <div style={{ height:6, background:'var(--border)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{
                    height:'100%', borderRadius:99, transition:'width .6s ease',
                    width:`${val}%`,
                    background: val > 80 ? 'linear-gradient(90deg,#f87171,#dc2626)' : 'linear-gradient(90deg,#93c5fd,#2563eb)',
                  }}/>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
