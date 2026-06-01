import { useState } from 'react'

function Toggle({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      width:44, height:24, borderRadius:99, cursor:'pointer', transition:'background .2s',
      background: checked ? 'var(--blue)' : 'var(--border)', position:'relative', flexShrink:0,
    }}>
      <div style={{
        position:'absolute', top:3, left: checked ? 23 : 3, width:18, height:18,
        borderRadius:'50%', background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,0.2)',
        transition:'left .2s',
      }}/>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border-light)', background:'var(--bg)' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{title}</div>
      </div>
      <div style={{ padding:'4px 0' }}>{children}</div>
    </div>
  )
}

function Row({ label, desc, children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid var(--border-light)' }}>
      <div>
        <div style={{ fontSize:14, fontWeight:500 }}>{label}</div>
        {desc && <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{desc}</div>}
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const [s, setS] = useState({
    streaming:true, autoRestart:true, alerts:true, darkLogs:true,
    cpuThreshold:90, memThreshold:85, logRetention:'7',
    clusterName:'Core Cluster', version:'v2.4.1-stable',
  })
  const set = (k,v) => setS(prev => ({...prev, [k]:v}))

  return (
    <div style={{ padding:24, maxWidth:760, display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.4px' }}>Settings</h1>
        <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>Cluster configuration and preferences</p>
      </div>

      <Section title="Cluster Identity">
        <Row label="Cluster Name" desc="Display name for this cluster">
          <input value={s.clusterName} onChange={e=>set('clusterName',e.target.value)} style={{
            padding:'6px 12px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)',
            fontSize:13, fontFamily:'var(--font-mono)', background:'var(--bg)', color:'var(--text-primary)',
            outline:'none', width:200,
          }}/>
        </Row>
        <Row label="Version Tag" desc="Current stable release tag">
          <span style={{ fontFamily:'var(--font-mono)', fontSize:12, background:'var(--blue-light)', color:'var(--blue)', padding:'3px 10px', borderRadius:6, fontWeight:600 }}>{s.version}</span>
        </Row>
      </Section>

      <Section title="Live Monitoring">
        <Row label="Streaming Logs" desc="Stream cluster logs in real time">
          <Toggle checked={s.streaming} onChange={v=>set('streaming',v)}/>
        </Row>
        <Row label="Auto-Restart on Anomaly" desc="Trigger pod restart when threshold exceeded">
          <Toggle checked={s.autoRestart} onChange={v=>set('autoRestart',v)}/>
        </Row>
        <Row label="Anomaly Alerts" desc="Send alerts when anomalies are detected">
          <Toggle checked={s.alerts} onChange={v=>set('alerts',v)}/>
        </Row>
        <Row label="Dark Log Console" desc="Use dark terminal theme for log viewer">
          <Toggle checked={s.darkLogs} onChange={v=>set('darkLogs',v)}/>
        </Row>
      </Section>

      <Section title="Thresholds">
        <Row label="CPU Alert Threshold" desc={`Alert when CPU exceeds ${s.cpuThreshold}%`}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <input type="range" min={50} max={99} value={s.cpuThreshold} onChange={e=>set('cpuThreshold',+e.target.value)} style={{ width:120 }}/>
            <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:14, width:36, color:'var(--red)' }}>{s.cpuThreshold}%</span>
          </div>
        </Row>
        <Row label="Memory Alert Threshold" desc={`Alert when memory exceeds ${s.memThreshold}%`}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <input type="range" min={50} max={99} value={s.memThreshold} onChange={e=>set('memThreshold',+e.target.value)} style={{ width:120 }}/>
            <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:14, width:36, color:'var(--amber)' }}>{s.memThreshold}%</span>
          </div>
        </Row>
        <Row label="Log Retention" desc="Days to retain cluster action logs">
          <select value={s.logRetention} onChange={e=>set('logRetention',e.target.value)} style={{
            padding:'6px 12px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)',
            fontSize:13, background:'var(--bg)', color:'var(--text-primary)', outline:'none',
          }}>
            {['1','3','7','14','30'].map(d => <option key={d} value={d}>{d} days</option>)}
          </select>
        </Row>
      </Section>

      <div style={{ display:'flex', gap:10 }}>
        <button style={{
          padding:'10px 24px', borderRadius:'var(--radius-sm)', background:'var(--blue)',
          color:'#fff', fontWeight:600, fontSize:14, border:'none', cursor:'pointer',
          boxShadow:'0 4px 12px rgba(37,99,235,0.3)',
        }}>Save Changes</button>
        <button style={{
          padding:'10px 24px', borderRadius:'var(--radius-sm)', background:'var(--card-bg)',
          color:'var(--text-secondary)', fontWeight:600, fontSize:14,
          border:'1px solid var(--border)', cursor:'pointer',
        }}>Reset to Default</button>
      </div>
    </div>
  )
}
