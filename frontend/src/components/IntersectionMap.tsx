import { useTrafficState } from "@/hooks/useTrafficState";
import { LANES } from "@/backend/schemas";

export function IntersectionMap() {
  const signals = useTrafficState((s) => s.signals);
  const detections = useTrafficState((s) => s.detections);
  const emergency = useTrafficState((s) => s.emergency);

  const colorFor = (lane: typeof LANES[number]) => {
    const d = detections[lane]?.density_score ?? 0;
    if (d < 0.4) return "hsl(var(--density-low))";
    if (d < 0.7) return "hsl(var(--density-medium))";
    return "hsl(var(--density-high))";
  };

  const activeGreen = LANES.find((l) => signals[l].state === "GREEN") ?? "north";
  const corridor = new Set(emergency?.corridor ?? []);

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full">
      <rect width="300" height="300" fill="hsl(var(--background))" />
      {/* roads */}
      <rect x="120" y="0" width="60" height="300" fill="hsl(var(--secondary))" />
      <rect x="0" y="120" width="300" height="60" fill="hsl(var(--secondary))" />
      {/* lane dashes */}
      <line x1="150" y1="0" x2="150" y2="300" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="6 6" />
      <line x1="0" y1="150" x2="300" y2="150" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="6 6" />

      {/* approach arrows colored by congestion */}
      {[
        { lane: "north" as const, points: "140,40 160,40 160,100 170,100 150,120 130,100 140,100", label: "N", x: 150, y: 25 },
        { lane: "south" as const, points: "140,260 160,260 160,200 170,200 150,180 130,200 140,200", label: "S", x: 150, y: 285 },
        { lane: "east" as const, points: "260,140 260,160 200,160 200,170 180,150 200,130 200,140", label: "E", x: 280, y: 155 },
        { lane: "west" as const, points: "40,140 40,160 100,160 100,170 120,150 100,130 100,140", label: "W", x: 20, y: 155 },
      ].map((c) => (
        <g key={c.lane}>
          <polygon
            points={c.points}
            fill={colorFor(c.lane)}
            opacity={corridor.has(c.lane) ? 1 : 0.85}
            stroke={corridor.has(c.lane) ? "hsl(var(--signal-green))" : "none"}
            strokeWidth="2"
            strokeDasharray={corridor.has(c.lane) ? "6 4" : undefined}
            className={corridor.has(c.lane) ? "animate-corridor-dash" : ""}
          />
          <text x={c.x} y={c.y} fill="hsl(var(--foreground))" fontSize="11" fontFamily="JetBrains Mono" textAnchor="middle">{c.label}</text>
        </g>
      ))}

      {/* center status */}
      <rect x="125" y="125" width="50" height="50" fill="hsl(var(--panel))" stroke="hsl(var(--panel-border))" />
      <text x="150" y="148" fill="hsl(var(--primary))" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">GREEN</text>
      <text x="150" y="162" fill="hsl(var(--foreground))" fontSize="11" fontFamily="JetBrains Mono" textAnchor="middle">{activeGreen.toUpperCase()}</text>
    </svg>
  );
}
