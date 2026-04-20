import { useState } from "react";
import { useTrafficState } from "@/hooks/useTrafficState";
import { LANES, type Lane } from "@/backend/schemas";
import { cn } from "@/lib/utils";

const POS: Record<Lane, { x: number; y: number }> = {
  north: { x: 50, y: 22 },
  south: { x: 50, y: 78 },
  east: { x: 78, y: 50 },
  west: { x: 22, y: 50 },
};

function colorFor(d: number) {
  if (d < 0.4) return "hsl(var(--density-low))";
  if (d < 0.7) return "hsl(var(--density-medium))";
  return "hsl(var(--density-high))";
}

export function MapView() {
  const detections = useTrafficState((s) => s.detections);
  const emergency = useTrafficState((s) => s.emergency);
  const [mode, setMode] = useState<"markers" | "heat" | "both">("both");

  return (
    <div className="bg-panel border border-panel rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-mono uppercase tracking-wider text-primary">Live Map · Bengaluru</h2>
        <div className="flex gap-1">
          {(["markers", "heat", "both"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-2 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider",
                mode === m ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              )}
            >{m}</button>
          ))}
        </div>
      </div>
      <div className="h-72 rounded-md overflow-hidden border border-panel-border bg-background relative">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* grid background */}
          <defs>
            <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="hsl(var(--panel-border))" strokeWidth="0.2" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          {/* roads */}
          <rect x="46" y="0" width="8" height="100" fill="hsl(var(--secondary))" />
          <rect x="0" y="46" width="100" height="8" fill="hsl(var(--secondary))" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="hsl(var(--muted-foreground))" strokeWidth="0.2" strokeDasharray="2 2" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="hsl(var(--muted-foreground))" strokeWidth="0.2" strokeDasharray="2 2" />

          {/* heat halos */}
          {(mode === "heat" || mode === "both") && LANES.map((l) => {
            const d = detections[l]?.density_score ?? 0;
            return (
              <circle key={`h-${l}`} cx={POS[l].x} cy={POS[l].y}
                r={6 + d * 10} fill={colorFor(d)} opacity="0.18" />
            );
          })}

          {/* emergency corridor */}
          {emergency && (
            <line
              x1={POS[emergency.corridor[0]].x} y1={POS[emergency.corridor[0]].y}
              x2={POS[emergency.corridor[1]].x} y2={POS[emergency.corridor[1]].y}
              stroke="hsl(var(--signal-green))" strokeWidth="1.2"
              strokeDasharray="2 1.5" className="animate-corridor-dash"
            />
          )}

          {/* markers */}
          {(mode === "markers" || mode === "both") && LANES.map((l) => {
            const d = detections[l]?.density_score ?? 0;
            return (
              <g key={l}>
                <circle cx={POS[l].x} cy={POS[l].y}
                  r={2 + d * 4} fill={colorFor(d)}
                  stroke="hsl(var(--background))" strokeWidth="0.4" />
                <text x={POS[l].x} y={POS[l].y - (3 + d * 4)} fontSize="2.5"
                  fontFamily="JetBrains Mono" fill="hsl(var(--foreground))" textAnchor="middle">
                  {l[0].toUpperCase()} {(d * 100).toFixed(0)}%
                </text>
              </g>
            );
          })}
        </svg>
        <div className="absolute bottom-2 left-2 text-[10px] font-mono text-muted-foreground">
          12.9716°N · 77.5946°E · Bengaluru
        </div>
      </div>
    </div>
  );
}
