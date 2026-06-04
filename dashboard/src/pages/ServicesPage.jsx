
import { useState, useEffect } from 'react'

// Static metadata that backend doesn't expose
const SERVICE_META = {
  frontend:  { name: 'frontend-v2',     version: 'v2.4.1', pods: 3 },
  order:     { name: 'order-svc-a1',    version: 'v1.9.3', pods: 2 },
  inventory: { name: 'inventory-svc',   version: 'v3.1.0', pods: 2 },
  auth:      { name: 'auth-svc',        version: 'v2.0.7', pods: 4 },
  db:        { name: 'core-db-primary', version: 'v14.2',  pods: 1 },
}

// Static fallback for nodes backend doesn't track
const STATIC_NODES = {
  auth: { cpu: 15, mem: 20, status: 'healthy' },
  db:   { cpu: 22, mem: 45, status: 'healthy' },
}

// Derive HTTP health code from status + cpu
const deriveHealth = (status, cpu) => {
  if (status === 'anomaly') return 503
  if (cpu > 70) return 429
  return 200
}

// Derive latency string from cpu (order-svc pattern)
const deriveLatency = (id, cpu) => {
  if (id === 'db') return '12ms'
  if (id === 'auth') return '28ms'
  const base = { frontend: 42, order: 120, inventory: 58 }[id] ?? 60
  const ms = Math.round(base + cpu * 1.5)
  return `${ms}ms`
}

// Static uptime (not exposed by backend)
const UPTIME = {
  frontend: '99.98%', order: '97.12%', inventory: '99.95%', auth: '99.99%', db: '99.99%',
}

// Static RPM (not exposed by backend)
const RPM = {
  frontend: '12,450', order: '8,231', inventory: '5,110', auth: '22,300', db: '—',
}

const SERVICE_ORDER = ['frontend', 'order', 'inventory', 'auth', 'db']

export default function ServicesPage() {
  const [nodes, setNodes] = useState({
    frontend:  { cpu: 0, mem: 0, status: 'healthy' },
    order:     { cpu: 0, mem: 0, status: 'healthy' },
    inventory: { cpu: 0, mem: 0, status: 'healthy' },
    ...STATIC_NODES,
  })
  const [connected, setConnected] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('http://localhost:8000/status')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setConnected(true)
        setNodes(prev => ({
          ...prev,
          ...Object.fromEntries(
            ['frontend', 'order', 'inventory'].map(id => [
              id,
              data.nodes?.[id]
                ? { cpu: data.nodes[id].cpu, mem: data.nodes[id].mem, status: data.nodes[id].status }
                : prev[id],
            ])
          ),
        }))
      } catch {
        setConnected(false)
      }
    }
    poll()
    const t = setInterval(poll, 2000)
    return () => clearInterval(t)
  }, [])

  const services = SERVICE_ORDER.map(id => ({
    id,
    ...SERVICE_META[id],
    ...nodes[id],
    health:  deriveHealth(nodes[id].status, nodes[id].cpu),
    latency: deriveLatency(id, nodes[id].cpu),
    uptime:  UPTIME[id],
    rpm:     RPM[id],
  }))

  const filtered = services.filter(s => filter === 'all' || s.status === filter)
  const anomalyCount = services.filter(s => s.status === 'anomaly').length

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>Services</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {services.length} services registered in Core Cluster
            {anomalyCount > 0 && (
              <span style={{ color: 'var(--red)', fontWeight: 600, marginLeft: 8 }}>
                · {anomalyCount} anomaly detected
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Connection badge */}
          <div style={{
            background: connected ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${connected ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: 99, padding: '5px 12px',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: connected ? '#16a34a' : '#dc2626',
              animation: connected ? 'blink 1.8s ease infinite' : 'none',
            }} />
            <span style={{
              fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700,
              color: connected ? '#16a34a' : '#dc2626',
            }}>
              {connected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'healthy', 'anomaly'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '7px 16px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600,
                border: '1px solid var(--border)', cursor: 'pointer', transition: 'all .15s',
                background: filter === f ? 'var(--blue)' : 'var(--card-bg)',
                color: filter === f ? '#fff' : 'var(--text-secondary)',
                borderColor: filter === f ? 'var(--blue)' : 'var(--border)',
              }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              {['Service', 'Status', 'Health', 'CPU', 'Mem', 'Latency', 'RPM', 'Pods', 'Version'].map(h => (
                <th key={h} style={{
                  padding: '10px 16px', textAlign: 'left', fontSize: 11,
                  fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
                  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id}
                style={{
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border-light)' : 'none',
                  background: s.status === 'anomaly' ? 'rgba(220,38,38,0.02)' : 'transparent',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = s.status === 'anomaly' ? 'rgba(220,38,38,0.05)' : 'var(--bg)'}
                onMouseLeave={e => e.currentTarget.style.background = s.status === 'anomaly' ? 'rgba(220,38,38,0.02)' : 'transparent'}
              >
                {/* Service name */}
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{s.id}</div>
                </td>

                {/* Status pill */}
                <td style={{ padding: '12px 16px' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: s.status === 'anomaly' ? 'var(--red-light)' : 'var(--green-light)',
                    color: s.status === 'anomaly' ? 'var(--red)' : 'var(--green)',
                    padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: s.status === 'anomaly' ? 'var(--red)' : 'var(--green)',
                      animation: s.status === 'anomaly' ? 'blink 1.2s ease infinite' : 'none',
                    }} />
                    {s.status === 'anomaly' ? 'Anomaly' : 'Healthy'}
                  </div>
                </td>

                {/* HTTP health code */}
                <td style={{
                  padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 13,
                  color: s.health >= 400 ? 'var(--red)' : 'var(--green)', fontWeight: 700,
                }}>{s.health}</td>

                {/* CPU — live */}
                <td style={{
                  padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600,
                  color: s.cpu > 80 ? 'var(--red)' : 'var(--text-primary)',
                }}>
                  {typeof s.cpu === 'number' ? s.cpu.toFixed(1) : s.cpu}%
                </td>

                {/* Mem — live */}
                <td style={{
                  padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600,
                  color: s.mem > 80 ? 'var(--red)' : 'var(--text-primary)',
                }}>
                  {typeof s.mem === 'number' ? s.mem.toFixed(1) : s.mem}%
                </td>

                {/* Latency — derived */}
                <td style={{
                  padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600,
                  color: parseInt(s.latency) > 200 ? 'var(--red)' : 'var(--text-primary)',
                }}>{s.latency}</td>

                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)' }}>{s.rpm}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)' }}>{s.pods}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{s.version}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
