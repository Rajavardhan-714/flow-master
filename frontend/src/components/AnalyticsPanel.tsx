import { useState } from "react";
import { useTrafficState } from "@/hooks/useTrafficState";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { cn } from "@/lib/utils";

const LANE_COLORS = {
  north: "hsl(280 70% 65%)",
  south: "hsl(175 70% 55%)",
  east: "hsl(1 73% 65%)",
  west: "hsl(215 15% 70%)",
};

type Tab = "live" | "forecast" | "stats";

export function AnalyticsPanel() {
  const [tab, setTab] = useState<Tab>("live");
  const trends = useTrafficState((s) => s.trends);
  const predictions = useTrafficState((s) => s.predictions);
  const meta = useTrafficState((s) => s.predictionMeta);
  const detections = useTrafficState((s) => s.detections);
  const totalVehicles = useTrafficState((s) => s.totalVehicles);
  const emergencyCount = useTrafficState((s) => s.emergencyCount);

  const avgDensity = (Object.values(detections).reduce((a, d) => a + (d?.density_score ?? 0), 0)) / 4;
  const efficiency = Math.max(0, Math.min(1, 1 - avgDensity * 0.6 + 0.4 * 0.7));

  return (
    <div className="bg-panel border border-panel rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-mono uppercase tracking-wider text-primary">Analytics</h2>
        <div className="flex gap-1">
          {(["live", "forecast", "stats"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-colors",
                tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >{t}</button>
          ))}
        </div>
      </div>

      {tab === "live" && (
        <div className="h-56">
          <ResponsiveContainer>
            <LineChart data={trends.slice(-90)}>
              <CartesianGrid stroke="hsl(var(--panel-border))" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis domain={[0, 1]} stroke="hsl(var(--muted-foreground))" fontSize={10}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {(["north", "south", "east", "west"] as const).map((l) => (
                <Line key={l} type="monotone" dataKey={l} stroke={LANE_COLORS[l]} dot={false} strokeWidth={2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === "forecast" && (
        <div>
          <div className="h-48">
            <ResponsiveContainer>
              <LineChart data={predictions}>
                <CartesianGrid stroke="hsl(var(--panel-border))" strokeDasharray="3 3" />
                <XAxis dataKey="minute" stroke="hsl(var(--muted-foreground))" fontSize={10}
                  tickFormatter={(v) => `+${v}m`} />
                <YAxis domain={[0, 1]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {(["north", "south", "east", "west"] as const).map((l) => (
                  <Line key={l} type="monotone" dataKey={l} stroke={LANE_COLORS[l]}
                    strokeDasharray="5 5" dot={{ r: 3 }} strokeWidth={2} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {meta && (
            <div className="mt-2 p-3 rounded border border-primary/30 bg-primary/5 text-xs font-mono">
              <div className="text-muted-foreground">Generated {meta.generatedAt} · confidence {meta.confidence}</div>
              <div className="text-primary mt-1">→ {meta.recommendation}</div>
            </div>
          )}
        </div>
      )}

      {tab === "stats" && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total vehicles" value={totalVehicles.toLocaleString()} />
          <StatCard label="Avg density" value={`${(avgDensity * 100).toFixed(0)}%`} />
          <StatCard label="Emergency events" value={String(emergencyCount)} />
          <StatCard label="Efficiency" value={`${(efficiency * 100).toFixed(0)}%`} />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-panel-border rounded-md p-3 bg-background/40">
      <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">{label}</div>
      <div className="text-2xl font-mono text-primary mt-1">{value}</div>
    </div>
  );
}
