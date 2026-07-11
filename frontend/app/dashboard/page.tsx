import { QuickStats } from "../../components/QuickStats";
import { SensorTicker } from "../../components/SensorTicker";

export default function DashboardPage() {
  return (
    <div style={{maxWidth:1200,margin:'18px auto'}}>
      <h1 style={{fontSize:22,fontWeight:800,marginBottom:8}}>Dashboard</h1>
      <p style={{color:'var(--text-muted)',marginTop:0}}>Minimal, high-contrast overview for operational staff.</p>

      <section style={{marginTop:18}}>
        <QuickStats />
      </section>

      <section style={{marginTop:18}}>
        <div style={{display:'flex',gap:12,flexDirection:'column'}}>
          <div className="glass-card">
            <h3 style={{margin:0,fontSize:14,fontWeight:700}}>Live Sensors</h3>
            <div style={{marginTop:12}}>
              <SensorTicker />
            </div>
          </div>

          <div className="glass-card">
            <h3 style={{margin:0,fontSize:14,fontWeight:700}}>Operational Alerts</h3>
            <div style={{marginTop:12,color:'var(--text-muted)'}}>No critical alerts. All systems nominal.</div>
          </div>
        </div>
      </section>
    </div>
  );
}
