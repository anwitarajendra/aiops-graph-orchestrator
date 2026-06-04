
import { useState, useEffect, useRef } from 'react'

// ── Sparkline: keeps its own history buffer, fed from outside ──
function Sparkline({ data, color, height = 48 }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 200, h = height
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 6) - 3}`)
    .join(' ')
  const gradId = `g-${color.replace('#', '')}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill={`url(#${gradId})`} stroke="none" points={`0,${h} ${pts} ${w},${h}`} />
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" points={pts} />
    </svg>
  )
}

// ── MetricCard: accepts a live value + history buffer ──
function MetricCard({ title, value, unit, sub, color, history }) {
  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '18px 20px',
      boxShadow: 'var(--shadow)', flex: 1, minWidth: 180,
    }}>
      <div style={{
        fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
        fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
      }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>{value}</span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{unit}</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
      <div style={{ marginTop: 10 }}>
        {history.length >= 2
          ? <Sparkline data={history} color={color} />
          : <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>awaiting data…</div>
        }
      </div>
    </div>
  )
}

// Services tracked by backend
const SERVICES = ['frontend', 'order', 'inventory']
// db + auth are static fallback (backend doesn't expose them)
const STATIC_NODES = {
  db:   { cpu: 22, mem: 45, status: 'healthy' },
  auth: { cpu: 15, mem: 20, status: 'healthy' },
}
const HISTORY_LEN = 20

// Derive aggregate metrics from all nodes
function deriveAggregates(nodeMap) {
  const all = Object.values(nodeMap)
  const cpuAvg = all.reduce((s, n) => s + n.cpu, 0) / all.length
  const memAvg = all.reduce((s, n) => s + n.mem, 0) / all.length
  const errorSvc = all.filter(n => n.status === 'anomaly').length
  const errorRate = (errorSvc / all.length) * 100
  return { cpuAvg, memAvg, errorRate }
}

export default function MetricsPage() {
  // Live node data from backend (frontend/order/inventory)
  const [nodes, setNodes] = useState({
    frontend:  { cpu: 0, mem: 0, status: 'healthy' },
    order:     { cpu: 0, mem: 0, status: 'healthy' },
    inventory: { cpu: 0, mem: 0, status: 'healthy' },
    ...STATIC_NODES,
  })
  const [connected, setConnected] = useState(false)

  // Sparkline history buffers (one per metric)
  const [cpuHistory,     setCpuHistory]     = useState([])
  const [memHistory,     setMemHistory]     = useState([])
  const [latencyHistory, setLatencyHistory] = useState([])
  const [errorHistory,   setErrorHistory]   = useState([])

  // Latency is not exposed by the backend; we synthesise it from order-svc cpu
  // (high cpu correlates with high latency in the demo scenario)
  const latencyRef = useRef(236)

  useEffect(() => {
    const POLL_URL = 'http://localhost:8000/status'

    const push = (setter, val) =>
      setter(prev => [...prev.slice(-(HISTORY_LEN - 1)), val])

    const poll = async () => {
      try {
        const res = await fetch(POLL_URL)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setConnected(true)

        // Merge backend nodes with static fallbacks
        const updated = {
          ...STATIC_NODES,
          ...Object.fromEntries(
            SERVICES.map(s => [
              s,
              data.nodes?.[s]
                ? { cpu: data.nodes[s].cpu, mem: data.nodes[s].mem, status: data.nodes[s].status }
                : nodes[s],
            ])
          ),
        }
        setNodes(updated)

        const { cpuAvg, memAvg, errorRate } = deriveAggregates(updated)

        // Synthesise latency: base 120ms + order cpu contribution
        const orderCpu = updated.order?.cpu ?? 50
        latencyRef.current = Math.round(120 + orderCpu * 1.8)

        push(setCpuHistory,     Math.round(cpuAvg * 10) / 10)
        push(setMemHistory,     Math.round(memAvg * 10) / 10)
        push(setLatencyHistory, latencyRef.current)
        push(setErrorHistory,   Math.round(errorRate * 10) / 10)
      } catch {
        setConnected(false)
      }
    }

    poll()
    const timer = setInterval(poll, 2000)
    return () => clearInterval(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived display values ──
  const allNodes = Object.values(nodes)
  const cpuAvg   = allNodes.reduce((s, n) => s + n.cpu, 0) / allNodes.length
  const memAvg   = allNodes.reduce((s, n) => s + n.mem, 0) / allNodes.length
  const memGB    = ((memAvg / 100) * 16).toFixed(1)   // assume 16GB total per node
  const errorRate = (allNodes.filter(n => n.status === 'anomaly').length / allNodes.length * 100)
  const anomalySvc = Object.entries(nodes).find(([, n]) => n.status === 'anomaly')?.[0]

  // Node bars (all 5)
  const NODE_DISPLAY = [
    { name: 'FRONTEND-NODE', ...nodes.frontend, color: nodes.frontend.status === 'anomaly' ? 'var(--red)' : 'var(--blue)' },
    { name: 'ORDER-NODE',    ...nodes.order,    color: nodes.order.status    === 'anomaly' ? 'var(--red)' : 'var(--blue)' },
    { name: 'INV-NODE',      ...nodes.inventory, color: nodes.inventory.status === 'anomaly' ? 'var(--red)' : 'var(--blue)' },
    { name: 'AUTH-NODE',     ...nodes.auth,     color: 'var(--blue)' },
    { name: 'DB-NODE',       ...nodes.db,       color: 'var(--blue)' },
  ]

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>Metrics</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Real-time cluster performance — auto-refreshing every 2s
          </p>
        </div>
        {/* Connection badge */}
        <div style={{
          background: connected ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${connected ? '#bbf7d0' : '#fecaca'}`,
          borderRadius: 99, padding: '5px 14px',
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: connected ? '#16a34a' : '#dc2626',
            animation: connected ? 'blink 1.8s ease infinite' : 'none',
          }} />
          <span style={{
            fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700,
            color: connected ? '#16a34a' : '#dc2626',
          }}>
            {connected ? 'BACKEND LIVE' : 'BACKEND OFFLINE'}
          </span>
        </div>
      </div>

      {/* ── Top metric cards ── */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <MetricCard
          title="Cluster CPU"
          value={cpuAvg.toFixed(1)}
          unit="%"
          sub="avg across all nodes"
          color="#2563eb"
          history={cpuHistory}
        />
        <MetricCard
          title="Cluster Memory"
          value={memGB}
          unit="GB"
          sub="of 16GB total (avg)"
          color="#7c3aed"
          history={memHistory}
        />
        {/* RPM: not in backend; shown as static placeholder */}
        <MetricCard
          title="Total RPM"
          value="48K"
          unit="req/min"
          sub="across all services"
          color="#16a34a"
          history={Array.from({ length: HISTORY_LEN }, (_, i) => 55 + Math.sin(i * 0.6) * 8)}
        />
        <MetricCard
          title="Avg Latency"
          value={latencyRef.current}
          unit="ms"
          sub="p99 — derived from order-svc"
          color="#d97706"
          history={latencyHistory}
        />
        <MetricCard
          title="Error Rate"
          value={errorRate.toFixed(1)}
          unit="%"
          sub={anomalySvc ? `${anomalySvc}-svc elevated` : 'all services nominal'}
          color="#dc2626"
          history={errorHistory}
        />
      </div>

      {/* ── Per-node bars ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {NODE_DISPLAY.map(node => (
          <div key={node.name} style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '16px 20px', boxShadow: 'var(--shadow)',
          }}>
            <div style={{
              fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
              fontWeight: 600, marginBottom: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>{node.name}</span>
              {node.status === 'anomaly' && (
                <span style={{
                  fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700,
                  color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: 4, padding: '1px 6px', letterSpacing: '0.05em',
                }}>ANOMALY</span>
              )}
            </div>
            {[['CPU', node.cpu], ['MEM', node.mem]].map(([label, val]) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{label}</span>
                  <span style={{
                    fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700,
                    color: val > 80 ? 'var(--red)' : 'var(--text-primary)',
                  }}>{typeof val === 'number' ? val.toFixed(1) : val}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99, transition: 'width .6s ease',
                    width: `${Math.min(val, 100)}%`,
                    background: val > 80
                      ? 'linear-gradient(90deg,#f87171,#dc2626)'
                      : 'linear-gradient(90deg,#93c5fd,#2563eb)',
                  }} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
