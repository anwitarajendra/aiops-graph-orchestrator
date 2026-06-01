import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

const NAV = [
  { to: '/topology', label: 'Topology', icon: <TopologyIcon /> },
  { to: '/services', label: 'Services', icon: <ServicesIcon /> },
  { to: '/metrics',  label: 'Metrics',  icon: <MetricsIcon /> },
  { to: '/logs',     label: 'Logs',     icon: <LogsIcon /> },
  { to: '/settings', label: 'Settings', icon: <SettingsIcon /> },
]

export default function Layout() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width:'var(--sidebar-w)', flexShrink:0, background:'var(--sidebar-bg)',
        borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column',
        position:'fixed', top:0, left:0, bottom:0, zIndex:100,
      }}>
        {/* Brand */}
        <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid var(--border-light)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              boxShadow:'0 4px 12px rgba(37,99,235,0.35)'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="12" cy="12" r="3"/><circle cx="4" cy="6" r="2"/><circle cx="20" cy="6" r="2"/>
                <circle cx="4" cy="18" r="2"/><circle cx="20" cy="18" r="2"/>
                <line x1="6" y1="6" x2="10" y2="11"/><line x1="18" y1="6" x2="14" y2="11"/>
                <line x1="6" y1="18" x2="10" y2="13"/><line x1="18" y1="18" x2="14" y2="13"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:15, letterSpacing:'-0.3px', color:'var(--text-primary)' }}>
                GraphOps
              </div>
              <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)', marginTop:1 }}>
                Orchestrator
              </div>
            </div>
          </div>
          <div style={{
            marginTop:12, background:'var(--blue-light)', border:'1px solid var(--blue-mid)',
            borderRadius:6, padding:'4px 10px', display:'inline-flex', alignItems:'center', gap:6
          }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--blue)' }} />
            <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--blue)', fontWeight:600 }}>
              v2.4.1-stable
            </span>
          </div>
        </div>

        {/* Cluster label */}
        <div style={{ padding:'14px 20px 6px' }}>
          <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600 }}>
            Core Cluster
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'4px 12px', display:'flex', flexDirection:'column', gap:2 }}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
              borderRadius:var_radius_sm, fontSize:14, fontWeight:500, transition:'all .15s',
              background: isActive ? 'var(--blue-light)' : 'transparent',
              color: isActive ? 'var(--blue)' : 'var(--text-secondary)',
              textDecoration:'none',
            })}>
              {n.icon}
              {n.label}
            </NavLink>
          ))}
        </nav>

        {/* Deploy Button */}
        <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border-light)' }}>
          <button onClick={() => alert('Deploy New Node')} style={{
            width:'100%', background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',
            color:'#fff', border:'none', borderRadius:10, padding:'11px 0',
            fontWeight:600, fontSize:14, display:'flex', alignItems:'center',
            justifyContent:'center', gap:8, cursor:'pointer',
            boxShadow:'0 4px 14px rgba(37,99,235,0.4)', transition:'all .2s',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Deploy New Node
          </button>
        </div>

        {/* Bottom links */}
        <div style={{ padding:'0 16px 16px', display:'flex', flexDirection:'column', gap:1 }}>
          {[['Documentation','📄'],['Support','💬']].map(([label,icon]) => (
            <button key={label} style={{
              display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
              borderRadius:var_radius_sm, color:'var(--text-secondary)', fontSize:13,
              background:'none', border:'none', cursor:'pointer', width:'100%', textAlign:'left',
            }}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </div>
      </aside>

      {/* ── Main area ── */}
      <div style={{ marginLeft:'var(--sidebar-w)', flex:1, display:'flex', flexDirection:'column', minHeight:'100vh' }}>
        {/* Header */}
        <header style={{
          height:'var(--header-h)', background:'var(--sidebar-bg)',
          borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center',
          padding:'0 24px', gap:16, position:'sticky', top:0, zIndex:50,
        }}>
          <div style={{
            flex:1, maxWidth:400, display:'flex', alignItems:'center', gap:10,
            background:'var(--bg)', borderRadius:9, padding:'0 14px',
            border:'1px solid var(--border)', height:36,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search nodes…" style={{
                background:'none', border:'none', outline:'none', fontSize:13,
                color:'var(--text-primary)', width:'100%',
              }}/>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            {[TerminalIcon2, BellIcon, UserIcon].map((Icon, i) => (
              <button key={i} style={{
                width:36, height:36, borderRadius:9, display:'flex', alignItems:'center',
                justifyContent:'center', background:'transparent', border:'none',
                color:'var(--text-secondary)', cursor:'pointer', transition:'background .15s',
              }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                <Icon />
              </button>
            ))}
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex:1, overflow:'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const var_radius_sm = 'var(--radius-sm)'

function TopologyIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="2"/><circle cx="4" cy="6" r="2"/><circle cx="20" cy="6" r="2"/>
    <circle cx="4" cy="18" r="2"/><circle cx="20" cy="18" r="2"/>
    <line x1="6" y1="6" x2="10.5" y2="11"/><line x1="18" y1="6" x2="13.5" y2="11"/>
    <line x1="6" y1="18" x2="10.5" y2="13"/><line x1="18" y1="18" x2="13.5" y2="13"/>
  </svg>
}
function ServicesIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="7" height="7" rx="1"/><rect x="15" y="3" width="7" height="7" rx="1"/>
    <rect x="2" y="14" width="7" height="7" rx="1"/><rect x="15" y="14" width="7" height="7" rx="1"/>
  </svg>
}
function MetricsIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
}
function LogsIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/>
    <line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/>
  </svg>
}
function SettingsIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
}
function BellIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
}
function UserIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
}
function TerminalIcon2() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
  </svg>
}
