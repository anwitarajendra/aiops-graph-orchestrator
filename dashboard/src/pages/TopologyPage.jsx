
import { useEffect, useRef, useState, useCallback } from 'react'
import CytoscapeComponent from 'react-cytoscapejs'
import cytoscape from 'cytoscape'
import dagre from 'cytoscape-dagre'

cytoscape.use(dagre)

// ── Static edge topology (structure doesn't change, only node status does) ──
const STATIC_EDGES = [
  { data: { id: 'e1', source: 'frontend',  target: 'order',     status: 'healthy' } },
  { data: { id: 'e2', source: 'frontend',  target: 'auth',      status: 'healthy' } },
  { data: { id: 'e3', source: 'order',     target: 'inventory', status: 'healthy' } },
  { data: { id: 'e4', source: 'order',     target: 'db',        status: 'healthy' } },
  { data: { id: 'e5', source: 'inventory', target: 'db',        status: 'healthy' } },
]

// Fallback node list so UI renders even before first fetch
const FALLBACK_NODES = [
  { data: { id: 'frontend',  label: 'FRONTEND',  status: 'healthy', cpu: 0,  mem: 0 } },
  { data: { id: 'order',     label: 'ORDER-SVC', status: 'healthy', cpu: 0,  mem: 0 } },
  { data: { id: 'inventory', label: 'INVENTORY', status: 'healthy', cpu: 0,  mem: 0 } },
  { data: { id: 'db',        label: 'CORE-DB',   status: 'healthy', cpu: 0,  mem: 0 } },
  { data: { id: 'auth',      label: 'AUTH-SVC',  status: 'healthy', cpu: 0,  mem: 0 } },
]

// Label map for service ids returned by backend
const SERVICE_LABELS = {
  frontend:  'FRONTEND',
  order:     'ORDER-SVC',
  inventory: 'INVENTORY',
  db:        'CORE-DB',
  auth:      'AUTH-SVC',
}

// SVG icons per node id
const NODE_ICONS = {
  frontend:  `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><rect x='2' y='3' width='20' height='14' rx='2'/><line x1='8' y1='21' x2='16' y2='21'/><line x1='12' y1='17' x2='12' y2='21'/></svg>`,
  order:     `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%23dc2626' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><circle cx='9' cy='21' r='1'/><circle cx='20' cy='21' r='1'/><path d='M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6'/></svg>`,
  inventory: `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'/><polyline points='3.27 6.96 12 12.01 20.73 6.96'/><line x1='12' y1='22.08' x2='12' y2='12'/></svg>`,
  db:        `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><ellipse cx='12' cy='5' rx='9' ry='3'/><path d='M21 12c0 1.66-4 3-9 3s-9-1.34-9-3'/><path d='M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5'/></svg>`,
  auth:      `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='11' width='18' height='11' rx='2' ry='2'/><path d='M7 11V7a5 5 0 0 1 10 0v4'/></svg>`,
}

const makeIconUri = (id) => `data:image/svg+xml,${NODE_ICONS[id] || NODE_ICONS['db']}`

const buildStylesheet = () => [
  {
    selector: 'node',
    style: {
      'width': 80,
      'height': 80,
      'shape': 'roundrectangle',
      'corner-radius': 16,
      'background-color': '#ffffff',
      'border-width': 2.5,
      'border-color': '#2563eb',
      'background-image': (ele) => makeIconUri(ele.data('id')),
      'background-fit': 'none',
      'background-width': 34,
      'background-height': 34,
      'background-position-x': '50%',
      'background-position-y': '50%',
      'label': 'data(label)',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'font-size': 10,
      'font-family': "'JetBrains Mono', monospace",
      'font-weight': 700,
      'color': '#0f172a',
      'text-margin-y': 10,
      'text-background-opacity': 0,
      'box-shadow-blur': 8,
      'box-shadow-color': 'rgba(37,99,235,0.18)',
      'box-shadow-offset-x': 0,
      'box-shadow-offset-y': 2,
      'box-shadow-opacity': 1,
    }
  },
  {
    selector: 'node[status="anomaly"]',
    style: {
      'border-color': '#dc2626',
      'border-width': 2.5,
      'background-color': '#fff8f8',
      'color': '#dc2626',
      'box-shadow-color': 'rgba(220,38,38,0.22)',
    }
  },
  {
    selector: 'node:selected',
    style: {
      'border-color': '#7c3aed',
      'border-width': 3,
      'box-shadow-color': 'rgba(124,58,237,0.28)',
    }
  },
  {
    selector: 'edge',
    style: {
      'width': 2,
      'line-color': '#93c5fd',
      'target-arrow-color': '#93c5fd',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'arrow-scale': 1.1,
      'line-opacity': 0.9,
    }
  },
  {
    selector: 'edge[status="anomaly"]',
    style: {
      'line-color': '#fca5a5',
      'target-arrow-color': '#fca5a5',
      'line-style': 'dashed',
      'line-dash-pattern': [6, 3],
    }
  },
  {
    selector: 'edge:selected',
    style: {
      'line-color': '#7c3aed',
      'target-arrow-color': '#7c3aed',
    }
  }
]

function MiniBar({ danger }) {
  const heights = [40, 55, 45, 70, 60, 100]
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:32 }}>
      {heights.map((pct, i) => (
        <div key={i} style={{
          width: 6,
          height: `${pct * 0.32}px`,
          borderRadius: 2,
          background: danger
            ? (i === heights.length - 1 ? '#dc2626' : '#fca5a5')
            : (i === heights.length - 1 ? '#2563eb' : '#93c5fd'),
          transition: 'height .4s ease',
        }}/>
      ))}
    </div>
  )
}

function NodeCard({ node }) {
  const anomaly = node.data.status === 'anomaly'
  const [hovered, setHovered] = useState(false)

  // mem from backend is a float percentage (0–100)
  const memDisplay = typeof node.data.mem === 'number'
    ? `${node.data.mem.toFixed(1)}%`
    : node.data.mem

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: anomaly ? '#fffafa' : '#fff',
        border: `1.5px solid ${anomaly ? '#fca5a5' : hovered ? '#93c5fd' : '#e2e8f0'}`,
        borderRadius: 14,
        padding: '16px 18px',
        boxShadow: anomaly
          ? '0 0 0 3px rgba(220,38,38,0.07), 0 2px 8px rgba(220,38,38,0.08)'
          : hovered
            ? '0 4px 16px rgba(37,99,235,0.10)'
            : '0 1px 4px rgba(15,23,42,0.06)',
        flex: 1, minWidth: 175,
        transition: 'all .2s ease',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        borderRadius: '14px 14px 0 0',
        background: anomaly
          ? 'linear-gradient(90deg, #dc2626, #f87171)'
          : 'linear-gradient(90deg, #2563eb, #60a5fa)',
      }}/>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 14, marginTop: 4 }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.07em' }}>
          {node.data.id.toUpperCase()}-NODE
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: anomaly ? '#fef2f2' : '#eff6ff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {anomaly ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
              <ellipse cx="12" cy="12" rx="10" ry="4"/>
              <path d="M2 12c0 4 4.5 8 10 8s10-4 10-8"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
            </svg>
          )}
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
        <div>
          <div style={{ display:'flex', alignItems:'baseline', gap:5 }}>
            <span style={{ fontSize:28, fontWeight:700, fontFamily:'var(--font-mono)', lineHeight:1, color: anomaly ? '#dc2626' : '#0f172a' }}>
              {typeof node.data.cpu === 'number' ? node.data.cpu.toFixed(1) : node.data.cpu}%
            </span>
            <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontWeight:600, marginBottom:2 }}>CPU</span>
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:5, marginTop:4 }}>
            <span style={{ fontSize:18, fontWeight:700, fontFamily:'var(--font-mono)', lineHeight:1, color: anomaly ? '#dc2626' : '#334155' }}>
              {memDisplay}
            </span>
            <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontWeight:600 }}>MEM</span>
          </div>
          <div style={{
            marginTop:10, display:'inline-flex', alignItems:'center', gap:5,
            background: anomaly ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${anomaly ? '#fecaca' : '#bbf7d0'}`,
            borderRadius: 99, padding:'2px 10px',
          }}>
            <div style={{
              width:5, height:5, borderRadius:'50%',
              background: anomaly ? '#dc2626' : '#16a34a',
              animation: anomaly ? 'blink 1.2s ease infinite' : 'none',
            }}/>
            <span style={{ fontSize:10, fontFamily:'var(--font-mono)', fontWeight:700,
              color: anomaly ? '#dc2626' : '#16a34a' }}>
              {anomaly ? 'ANOMALY' : 'HEALTHY'}
            </span>
          </div>
        </div>
        <MiniBar danger={anomaly} />
      </div>
    </div>
  )
}

const LOGS_INIT = [
  { time:'--:--:--', level:'INFO', msg:'Waiting for backend connection at localhost:8000...' },
]
const LEVEL_COLOR  = { CRIT:'#dc2626', WARN:'#d97706', ACTN:'#d97706', INFO:'#2563eb' }
const LEVEL_BG     = { CRIT:'#fef2f2', WARN:'#fffbeb', ACTN:'#fffbeb', INFO:'#eff6ff' }

export default function TopologyPage() {
  const [nodes, setNodes]       = useState(FALLBACK_NODES)
  const [logs, setLogs]         = useState(LOGS_INIT)
  const [selected, setSelected] = useState(null)
  const [connected, setConnected] = useState(false)
  const [lastPollTs, setLastPollTs] = useState(null)
  const logsRef = useRef(null)
  const cyRef   = useRef(null)
  // Keep a ref to last seen actions to avoid duplicate log entries
  const seenActionsRef = useRef(new Set())

  const stylesheet = buildStylesheet()

  // ── Derive edges: mark edge as anomaly if either endpoint is anomaly ──
  const edges = STATIC_EDGES.map(edge => {
    const srcNode = nodes.find(n => n.data.id === edge.data.source)
    const tgtNode = nodes.find(n => n.data.id === edge.data.target)
    const edgeStatus =
      (srcNode?.data.status === 'anomaly' || tgtNode?.data.status === 'anomaly')
        ? 'anomaly'
        : 'healthy'
    return { data: { ...edge.data, status: edgeStatus } }
  })

  const elements = [
    ...nodes.map(n => ({ ...n })),
    ...edges,
  ]

  // ── Polling hook: hits /status every 2 seconds ──
  useEffect(() => {
    const POLL_URL = 'http://localhost:8000/status'
    const POLL_INTERVAL_MS = 2000

    const poll = async () => {
      try {
        const res = await fetch(POLL_URL)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()

        setConnected(true)
        setLastPollTs(data.timestamp)

        // Map backend nodes → cytoscape node format
        // Backend only returns frontend/order/inventory; db and auth stay at fallback
        setNodes(prev => prev.map(node => {
          const svc = data.nodes?.[node.data.id]
          if (!svc) return node // backend doesn't track this node (db, auth) — keep as-is
          return {
            data: {
              ...node.data,
              status: svc.status,
              cpu: svc.cpu,
              mem: svc.mem,
            }
          }
        }))

        // Append any new backend actions as log entries
        if (Array.isArray(data.actions)) {
          const now = new Date()
          const ts = [now.getHours(), now.getMinutes(), now.getSeconds()]
            .map(v => String(v).padStart(2, '0')).join(':')

          const newEntries = data.actions
            .filter(action => !seenActionsRef.current.has(action))
            .map(action => {
              seenActionsRef.current.add(action)
              return { time: ts, level: 'ACTN', msg: action }
            })

          if (newEntries.length > 0) {
            setLogs(prev => [...prev.slice(-40), ...newEntries])
          }
        }

        // Also add a periodic heartbeat log
        setLogs(prev => {
          const now = new Date()
          const ts = [now.getHours(), now.getMinutes(), now.getSeconds()]
            .map(v => String(v).padStart(2, '0')).join(':')
          const entry = { time: ts, level: 'INFO', msg: 'Poll OK — metrics refreshed from orchestrator' }
          // Only append if last entry wasn't also a poll-ok (avoid spam)
          const last = prev[prev.length - 1]
          if (last?.msg === entry.msg) return prev
          return [...prev.slice(-40), entry]
        })

      } catch (err) {
        setConnected(false)
        const now = new Date()
        const ts = [now.getHours(), now.getMinutes(), now.getSeconds()]
          .map(v => String(v).padStart(2, '0')).join(':')
        setLogs(prev => {
          const last = prev[prev.length - 1]
          const msg = `Backend unreachable: ${err.message}`
          if (last?.msg === msg) return prev // dedupe consecutive errors
          return [...prev.slice(-40), { time: ts, level: 'CRIT', msg }]
        })
      }
    }

    poll() // immediate first poll
    const timer = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  // Auto-scroll logs
  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight
  }, [logs])

  const stableCount  = nodes.filter(n => n.data.status === 'healthy').length
  const anomalyNodes = nodes.filter(n => n.data.status === 'anomaly')

  const handleCy = useCallback((cy) => {
    cyRef.current = cy
    cy.on('tap', 'node', evt => setSelected(evt.target.data()))
    cy.on('tap', evt => { if (evt.target === cy) setSelected(null) })
  }, [])

  return (
    <div style={{ padding:24, display:'flex', flexDirection:'column', gap:20 }}>

      {/* ── Status Banner ── */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{
          background:'#fff', border:'1px solid #e2e8f0', borderRadius:12,
          padding:'11px 18px', boxShadow:'0 1px 4px rgba(15,23,42,0.06)',
          display:'flex', alignItems:'center', gap:20,
        }}>
          <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>
            System Status
          </span>
          <div style={{ width:1, height:16, background:'#e2e8f0' }}/>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ width:8,height:8,borderRadius:'50%',background:'#2563eb' }}/>
            <span style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{stableCount} Services Stable</span>
          </div>
          {anomalyNodes.map(n => (
            <div key={n.data.id} style={{ display:'flex', alignItems:'center', gap:7 }}>
              <div style={{ position:'relative', width:9, height:9 }}>
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#dc2626', animation:'blink 1.2s ease infinite' }}/>
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#dc2626', animation:'pulse-ring 1.5s ease-out infinite' }}/>
              </div>
              <span style={{ fontSize:13, fontWeight:600, color:'#dc2626' }}>1 Anomaly ({n.data.label})</span>
            </div>
          ))}
        </div>

        {/* Backend connection badge */}
        <div style={{
          background: connected ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${connected ? '#bbf7d0' : '#fecaca'}`,
          borderRadius: 99, padding:'6px 14px',
          display:'flex', alignItems:'center', gap:7,
        }}>
          <div style={{
            width:7, height:7, borderRadius:'50%',
            background: connected ? '#16a34a' : '#dc2626',
            animation: connected ? 'blink 1.8s ease infinite' : 'none',
          }}/>
          <span style={{ fontSize:11, fontFamily:'var(--font-mono)', fontWeight:700,
            color: connected ? '#16a34a' : '#dc2626' }}>
            {connected ? 'BACKEND LIVE' : 'BACKEND OFFLINE'}
          </span>
        </div>

        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          {['Refresh','Export'].map(label => (
            <button key={label} style={{
              padding:'8px 18px', borderRadius:9, fontSize:13, fontWeight:600,
              border:'1px solid #e2e8f0', background:'#fff', color:'#64748b',
              cursor:'pointer', transition:'all .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.borderColor='#cbd5e1' }}
              onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.borderColor='#e2e8f0' }}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* ── Graph Card ── */}
      <div style={{
        background:'#fff', borderRadius:14, overflow:'hidden',
        border:'1px solid #e2e8f0',
        boxShadow:'0 4px 24px rgba(15,23,42,0.07), 0 1px 3px rgba(15,23,42,0.04)',
      }}>
        {/* Header */}
        <div style={{
          padding:'11px 18px', borderBottom:'1px solid #f1f5f9',
          display:'flex', alignItems:'center', gap:10,
          background:'linear-gradient(180deg,#fff 0%,#fafbfc 100%)',
        }}>
          {[['#ef4444','rgba(239,68,68,.25)'],['#f59e0b','rgba(245,158,11,.25)'],['#22c55e','rgba(34,197,94,.25)']].map(([c,s],i) => (
            <div key={i} style={{ width:11, height:11, borderRadius:'50%', background:c, boxShadow:`0 0 0 2px ${s}` }}/>
          ))}
          <div style={{
            marginLeft:8, display:'flex', alignItems:'center', gap:7,
            background:'#f8fafc', border:'1px solid #e2e8f0',
            borderRadius:99, padding:'4px 12px 4px 8px',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
              <circle cx="12" cy="12" r="2"/><circle cx="4" cy="6" r="1.5"/><circle cx="20" cy="6" r="1.5"/>
              <circle cx="4" cy="18" r="1.5"/><circle cx="20" cy="18" r="1.5"/>
              <line x1="5.5" y1="6.8" x2="10.5" y2="11"/><line x1="18.5" y1="6.8" x2="13.5" y2="11"/>
              <line x1="5.5" y1="17.2" x2="10.5" y2="13"/><line x1="18.5" y1="17.2" x2="13.5" y2="13"/>
            </svg>
            <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'#94a3b8', fontWeight:700, letterSpacing:'0.05em' }}>
              LIVE TOPOLOGY — CORE CLUSTER
            </span>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:7,
            background: connected ? '#f0fdf4' : '#fffbeb',
            border: `1px solid ${connected ? '#bbf7d0' : '#fde68a'}`,
            borderRadius:99, padding:'5px 12px' }}>
            <div style={{ position:'relative', width:7, height:7 }}>
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', background: connected ? '#16a34a' : '#d97706', animation:'blink 1.8s ease infinite' }}/>
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', background: connected ? '#16a34a' : '#d97706', animation:'pulse-ring 2s ease-out infinite' }}/>
            </div>
            <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color: connected ? '#16a34a' : '#d97706', fontWeight:700, letterSpacing:'0.05em' }}>
              {connected ? 'STREAMING LIVE' : 'RECONNECTING…'}
            </span>
          </div>
        </div>

        {/* Cytoscape canvas */}
        <div style={{
          height:400, position:'relative',
          background:'radial-gradient(ellipse at 35% 50%, #eef4ff 0%, #f5f7fb 55%, #f0f4f8 100%)',
          overflow:'hidden',
        }}>
          <div style={{
            position:'absolute', inset:0, zIndex:0,
            backgroundImage:'radial-gradient(circle, #c8d6e8 1.2px, transparent 1.2px)',
            backgroundSize:'26px 26px', opacity:0.5,
          }}/>
          <div style={{
            position:'absolute', top:0, left:0, right:0, height:2, zIndex:2,
            background:'linear-gradient(90deg,transparent,rgba(37,99,235,0.10) 50%,transparent)',
            animation:'scan 4s linear infinite', pointerEvents:'none',
          }}/>

          <CytoscapeComponent
            key="cy"
            elements={elements}
            stylesheet={stylesheet}
            layout={{ name:'dagre', rankDir:'LR', nodeSep:90, rankSep:170, padding:70 }}
            style={{ width:'100%', height:'100%', position:'relative', zIndex:1 }}
            cy={handleCy}
          />

          {anomalyNodes.length > 0 && (
            <div style={{
              position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)',
              background:'#fef2f2', border:'1px solid #fecaca', borderRadius:99,
              padding:'5px 16px', display:'flex', alignItems:'center', gap:8, zIndex:5,
              fontSize:11, fontFamily:'var(--font-mono)', color:'#dc2626', fontWeight:700,
              boxShadow:'0 2px 10px rgba(220,38,38,0.15)',
              animation:'slide-in .25s ease',
            }}>
              <div style={{ position:'relative', width:6, height:6 }}>
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#dc2626', animation:'blink 1.2s ease infinite' }}/>
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#dc2626', animation:'pulse-ring 1.5s ease-out infinite' }}/>
              </div>
              {anomalyNodes.length} ANOMALY — {anomalyNodes.map(n => n.data.label).join(', ')}
            </div>
          )}

          {selected && (
            <div style={{
              position:'absolute', top:14, right:14, zIndex:10,
              background:'#fff', border:'1px solid #e2e8f0',
              borderRadius:14, overflow:'hidden',
              boxShadow:'0 8px 32px rgba(15,23,42,0.13), 0 2px 6px rgba(15,23,42,0.06)',
              minWidth:200, animation:'slide-in .15s ease',
            }}>
              <div style={{
                padding:'10px 14px', borderBottom:'1px solid #f1f5f9',
                display:'flex', alignItems:'center', justifyContent:'space-between',
                background: selected.status === 'anomaly' ? '#fffafa' : '#f8faff',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{
                    width:30, height:30, borderRadius:9,
                    background: selected.status==='anomaly' ? '#fef2f2' : '#eff6ff',
                    border: `1.5px solid ${selected.status==='anomaly' ? '#fecaca' : '#bfdbfe'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {selected.status === 'anomaly'
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    }
                  </div>
                  <span style={{ fontSize:12, fontFamily:'var(--font-mono)', fontWeight:700, color:'#0f172a' }}>
                    {selected.label}
                  </span>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    width:22, height:22, borderRadius:6, border:'1px solid #e2e8f0',
                    background:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                    cursor:'pointer', color:'#94a3b8', fontSize:14, lineHeight:1,
                  }}
                >×</button>
              </div>
              <div style={{ padding:'10px 14px 12px' }}>
                {[
                  ['Status', selected.status],
                  ['CPU',    typeof selected.cpu === 'number' ? selected.cpu.toFixed(1) + '%' : selected.cpu + '%'],
                  ['Memory', typeof selected.mem === 'number' ? selected.mem.toFixed(1) + '%' : selected.mem],
                ].map(([k,v], idx, arr) => (
                  <div key={k} style={{
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'5px 0',
                    borderBottom: idx < arr.length-1 ? '1px solid #f1f5f9' : 'none',
                  }}>
                    <span style={{ fontSize:12, color:'#94a3b8', fontFamily:'var(--font-mono)' }}>{k}</span>
                    <span style={{
                      fontSize:12, fontFamily:'var(--font-mono)', fontWeight:700,
                      color: k==='Status'
                        ? (v==='anomaly' ? '#dc2626' : '#16a34a')
                        : (v && parseFloat(v) > 80 ? '#dc2626' : '#0f172a'),
                    }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {[
            { text:'CORE CLUSTER', style:{ top:10, left:14 } },
            { text:`${nodes.length} NODES`, style:{ top:10, right:14 } },
            { text:'v2.4.1-stable', style:{ bottom:10, left:14 } },
          ].map(({ text, style }) => (
            <div key={text} style={{
              position:'absolute', ...style, zIndex:3,
              fontSize:10, fontFamily:'var(--font-mono)', fontWeight:600,
              color:'#94a3b8', letterSpacing:'0.04em', opacity:0.75,
            }}>{text}</div>
          ))}
        </div>

        {/* Graph footer / legend */}
        <div style={{
          padding:'9px 18px', borderTop:'1px solid #f1f5f9',
          display:'flex', alignItems:'center', gap:16,
          background:'#fafbfc',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:7,height:7,borderRadius:'50%',background:'#2563eb' }}/>
            <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'#2563eb', fontWeight:700 }}>{stableCount} Healthy</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:7,height:7,borderRadius:'50%',background:'#dc2626',animation:'blink 1.2s ease infinite' }}/>
            <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'#dc2626', fontWeight:700 }}>{anomalyNodes.length} Anomaly</span>
          </div>
          {lastPollTs && (
            <div style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'#94a3b8' }}>
              last sync {new Date(lastPollTs * 1000).toLocaleTimeString()}
            </div>
          )}
          <div style={{ flex:1 }}/>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:18, height:0, borderTop:'2px solid #93c5fd' }}/>
              <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'#94a3b8', fontWeight:600 }}>healthy edge</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:18, height:0, borderTop:'2px dashed #fca5a5' }}/>
              <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'#94a3b8', fontWeight:600 }}>anomaly edge</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Node Cards ── */}
      <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
        {nodes.map(n => <NodeCard key={n.data.id} node={n} />)}
      </div>

      {/* ── Log Panel ── */}
      <div style={{
        background:'#fff', border:'1px solid #e2e8f0',
        borderRadius:14, overflow:'hidden',
        boxShadow:'0 1px 4px rgba(15,23,42,0.06)',
      }}>
        <div style={{
          padding:'10px 16px', borderBottom:'1px solid #f1f5f9',
          display:'flex', alignItems:'center', gap:8,
          background:'linear-gradient(180deg,#fff,#fafbfc)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="7" y1="8" x2="17" y2="8"/>
            <line x1="7" y1="12" x2="17" y2="12"/>
            <line x1="7" y1="16" x2="13" y2="16"/>
          </svg>
          <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>
            CLUSTER_ACTION_LOG
          </span>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:7,
            background: connected ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${connected ? '#bbf7d0' : '#fecaca'}`,
            borderRadius:99, padding:'3px 10px' }}>
            <div style={{ width:5,height:5,borderRadius:'50%',
              background: connected ? '#16a34a' : '#dc2626',
              animation:'blink 1.8s ease infinite' }}/>
            <span style={{ fontSize:10, fontFamily:'var(--font-mono)',
              color: connected ? '#16a34a' : '#dc2626', fontWeight:700 }}>
              {connected ? 'Streaming Live' : 'Offline'}
            </span>
          </div>
        </div>
        <div ref={logsRef} style={{ maxHeight:190, overflowY:'auto', padding:'4px 0' }}>
          {logs.map((log, i) => (
            <div key={i} style={{
              display:'flex', gap:12, padding:'6px 16px', alignItems:'baseline',
              background: log.level==='CRIT' ? 'rgba(220,38,38,0.035)' : 'transparent',
              borderLeft: `2.5px solid ${log.level==='CRIT' ? '#dc2626' : 'transparent'}`,
              animation: i === logs.length-1 ? 'slide-in .2s ease' : 'none',
            }}>
              <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'#94a3b8', flexShrink:0, minWidth:56 }}>{log.time}</span>
              <span style={{
                fontSize:10, fontFamily:'var(--font-mono)', fontWeight:700, flexShrink:0,
                color: LEVEL_COLOR[log.level] || '#2563eb',
                background: LEVEL_BG[log.level] || '#eff6ff',
                padding:'1px 7px', borderRadius:4,
              }}>[{log.level}]</span>
              <span style={{
                fontSize:11, fontFamily:'var(--font-mono)',
                color: log.level==='CRIT' ? '#dc2626' : '#1e293b',
                fontWeight: log.level==='CRIT' ? 600 : 400,
              }}>{log.msg}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
