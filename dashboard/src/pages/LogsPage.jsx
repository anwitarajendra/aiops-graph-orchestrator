
import { useState, useEffect, useRef } from 'react'

// Seed logs shown before backend connects
const BASE_LOGS = [
  { time: '14:00:01', level: 'INFO', svc: 'frontend-v2',   msg: 'Health check OK: 200' },
  { time: '14:01:15', level: 'INFO', svc: 'auth-svc',      msg: 'Token refresh batch: 2048 sessions renewed' },
  { time: '14:02:11', level: 'INFO', svc: 'frontend-v2',   msg: 'Service reported health check: 200 OK' },
  { time: '14:03:44', level: 'WARN', svc: 'order-svc',     msg: 'Response time elevated: p95=620ms' },
  { time: '14:04:10', level: 'INFO', svc: 'inventory-svc', msg: 'Cache warm-up complete: 8,200 records' },
  { time: '14:05:45', level: 'CRIT', svc: 'order-svc',     msg: 'Node order-svc-a1: Memory threshold exceeded (92%)' },
  { time: '14:06:02', level: 'ACTN', svc: 'k8s-scheduler', msg: 'Triggering automated restart: order-svc-a1' },
  { time: '14:06:15', level: 'INFO', svc: 'k8s-scheduler', msg: 'Pod order-svc-a1-restart pending allocation' },
  { time: '14:07:01', level: 'INFO', svc: 'inventory-svc', msg: 'Syncing inventory state with core-db-primary' },
  { time: '14:07:33', level: 'WARN', svc: 'order-svc',     msg: 'Latency spike: p99 > 800ms' },
]

// Classify a backend action string → log level + svc
function classifyAction(action) {
  const lower = action.toLowerCase()
  if (lower.includes('restart'))  return { level: 'ACTN', svc: 'k8s-scheduler' }
  if (lower.includes('scale'))    return { level: 'ACTN', svc: 'k8s-scheduler' }
  if (lower.includes('crit') || lower.includes('exceeded')) return { level: 'CRIT', svc: 'orchestrator' }
  if (lower.includes('warn'))     return { level: 'WARN', svc: 'orchestrator' }
  return { level: 'INFO', svc: 'orchestrator' }
}

// Classify node metrics → optional auto-generated log entries
function nodeStatusLog(id, node, ts) {
  if (node.status === 'anomaly') {
    return { time: ts, level: 'WARN', svc: `${id}-svc`, msg: `Anomaly detected — CPU ${node.cpu.toFixed(1)}% MEM ${node.mem.toFixed(1)}%` }
  }
  return null
}

const COLORS = { CRIT: 'var(--red)', WARN: 'var(--amber)', ACTN: 'var(--amber)', INFO: 'var(--blue)', DEBUG: 'var(--text-muted)' }
const BG     = { CRIT: 'var(--red-light)', WARN: 'var(--amber-light)', ACTN: 'var(--amber-light)', INFO: 'var(--blue-light)', DEBUG: 'var(--bg)' }

function nowTS() {
  const d = new Date()
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map(v => String(v).padStart(2, '0')).join(':')
}

export default function LogsPage() {
  const [logs, setLogs]       = useState(BASE_LOGS)
  const [filter, setFilter]   = useState('ALL')
  const [search, setSearch]   = useState('')
  const [connected, setConnected] = useState(false)
  const ref = useRef(null)

  // Track seen actions + last-polled node statuses to avoid duplicate entries
  const seenActionsRef   = useRef(new Set())
  const prevStatusRef    = useRef({})

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('http://localhost:8000/status')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setConnected(true)

        const ts = nowTS()
        const newEntries = []

        // 1. Backend actions (GNN decisions / restart commands)
        if (Array.isArray(data.actions)) {
          for (const action of data.actions) {
            if (!seenActionsRef.current.has(action)) {
              seenActionsRef.current.add(action)
              const { level, svc } = classifyAction(action)
              newEntries.push({ time: ts, level, svc, msg: action })
            }
          }
        }

        // 2. Status-change events (healthy → anomaly or anomaly → healthy)
        if (data.nodes) {
          for (const [id, node] of Object.entries(data.nodes)) {
            const prev = prevStatusRef.current[id]
            if (prev && prev !== node.status) {
              if (node.status === 'anomaly') {
                newEntries.push({ time: ts, level: 'CRIT', svc: `${id}-svc`, msg: `Status changed to ANOMALY — CPU ${node.cpu.toFixed(1)}% MEM ${node.mem.toFixed(1)}%` })
              } else {
                newEntries.push({ time: ts, level: 'INFO', svc: `${id}-svc`, msg: `Recovered to HEALTHY — CPU ${node.cpu.toFixed(1)}% MEM ${node.mem.toFixed(1)}%` })
              }
            }
            prevStatusRef.current[id] = node.status
          }
        }

        // 3. Periodic heartbeat (only if nothing else came in)
        if (newEntries.length === 0) {
          newEntries.push({ time: ts, level: 'INFO', svc: 'orchestrator', msg: 'Poll OK — all metrics refreshed' })
        }

        setLogs(prev => {
          // Dedupe: skip heartbeat if last entry was also a heartbeat
          const last = prev[prev.length - 1]
          const filtered = newEntries.filter(e =>
            !(e.msg === 'Poll OK — all metrics refreshed' && last?.msg === e.msg)
          )
          return filtered.length ? [...prev.slice(-80), ...filtered] : prev
        })

      } catch {
        setConnected(false)
        const ts = nowTS()
        setLogs(prev => {
          const last = prev[prev.length - 1]
          const msg = 'Backend unreachable — retrying…'
          if (last?.msg === msg) return prev
          return [...prev.slice(-80), { time: ts, level: 'CRIT', svc: 'system', msg }]
        })
      }
    }

    poll()
    const t = setInterval(poll, 2000)
    return () => clearInterval(t)
  }, [])

  // Auto-scroll
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [logs])

  const displayed = logs.filter(l =>
    (filter === 'ALL' || l.level === filter) &&
    (!search || l.msg.toLowerCase().includes(search.toLowerCase()) || l.svc.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, height: 'calc(100vh - var(--header-h))', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>Logs</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Live streaming cluster action log</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>

          {/* Connection badge */}
          <div style={{
            background: connected ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${connected ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: 99, padding: '4px 12px',
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
              {connected ? 'BACKEND LIVE' : 'BACKEND OFFLINE'}
            </span>
          </div>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card-bg)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0 12px', height: 34,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filter logs..."
              style={{ border: 'none', outline: 'none', fontSize: 13, background: 'none', width: 140, color: 'var(--text-primary)' }}
            />
          </div>

          {/* Level filters */}
          {['ALL', 'CRIT', 'WARN', 'INFO', 'ACTN'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12,
              fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${filter === f ? COLORS[f] || 'var(--blue)' : 'var(--border)'}`,
              background: filter === f ? (BG[f] || 'var(--blue-light)') : 'var(--card-bg)',
              color: filter === f ? (COLORS[f] || 'var(--blue)') : 'var(--text-muted)',
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* ── Log panel ── */}
      <div ref={ref} style={{
        flex: 1, overflowY: 'auto', background: '#0f172a', borderRadius: 'var(--radius)',
        fontFamily: 'var(--font-mono)', fontSize: 12, border: '1px solid #1e293b',
      }}>
        <div style={{ padding: '8px 0' }}>
          {displayed.map((log, i) => (
            <div key={i} style={{
              display: 'flex', gap: 16, padding: '5px 18px', alignItems: 'baseline',
              background: i === displayed.length - 1 ? 'rgba(255,255,255,0.03)' : 'transparent',
              borderLeft: log.level === 'CRIT' ? '2px solid #dc2626' : '2px solid transparent',
              animation: i === displayed.length - 1 ? 'slide-in .18s ease' : 'none',
            }}>
              <span style={{ color: '#475569', flexShrink: 0, fontSize: 11 }}>{log.time}</span>
              <span style={{
                flexShrink: 0, padding: '1px 6px', borderRadius: 3, fontSize: 10, fontWeight: 700,
                background: log.level === 'CRIT' ? 'rgba(220,38,38,0.2)' : log.level === 'WARN' || log.level === 'ACTN' ? 'rgba(217,119,6,0.2)' : 'rgba(37,99,235,0.2)',
                color: log.level === 'CRIT' ? '#f87171' : log.level === 'WARN' || log.level === 'ACTN' ? '#fbbf24' : '#93c5fd',
              }}>{log.level}</span>
              <span style={{ color: '#64748b', flexShrink: 0, fontSize: 11 }}>{log.svc}</span>
              <span style={{
                color: log.level === 'CRIT' ? '#fca5a5' : log.level === 'WARN' ? '#fde68a' : '#e2e8f0',
                fontWeight: log.level === 'CRIT' ? 600 : 400,
              }}>{log.msg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? 'var(--green)' : 'var(--red)', animation: 'blink 1.8s ease infinite' }} />
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          {displayed.length} entries — {connected ? 'streaming live from backend' : 'backend offline'}
        </span>
      </div>
    </div>
  )
}
