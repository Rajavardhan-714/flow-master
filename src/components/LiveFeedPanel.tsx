import { useTrafficState } from "@/hooks/useTrafficState";
import { LANES, type Lane } from "@/backend/schemas";
import { cn } from "@/lib/utils";

const LANE_COLORS: Record<string, string> = {
  car: "hsl(var(--density-low))",
  motorcycle: "hsl(var(--signal-yellow))",
  bus: "hsl(var(--signal-red))",
  truck: "hsl(var(--accent))",
};

function densityClass(d: number) {
  if (d < 0.4) return "bg-density-low";
  if (d < 0.7) return "bg-density-medium";
  return "bg-density-high";
}

function LaneFeed({ lane }: { lane: Lane }) {
  const det = useTrafficState((s) => s.detections[lane]);
  return (
    <div className="relative bg-black/80 border border-panel rounded-md overflow-hidden aspect-video">
      <div className="absolute top-1 left-2 text-[10px] font-mono text-primary/80 uppercase tracking-wider z-10">
        {lane} · DUMMY_DETECTOR
      </div>
      <svg viewBox="0 0 100 56" className="w-full h-full">
        <rect width="100" height="56" fill="hsl(var(--background))" />
        {det?.bounding_boxes.slice(0, 12).map((b, i) => (
          <rect
            key={i}
            x={b.x1 * 100} y={b.y1 * 56}
            width={(b.x2 - b.x1) * 100} height={(b.y2 - b.y1) * 56}
            fill="none" stroke={LANE_COLORS[b.cls] ?? "white"} strokeWidth="0.4"
          />
        ))}
      </svg>
      <div className="absolute bottom-1 left-2 right-2 flex items-center gap-2 text-[10px] font-mono">
        <div className="flex-1 h-1 bg-panel-border rounded">
          <div
            className={cn("h-full rounded transition-all", densityClass(det?.density_score ?? 0))}
            style={{ width: `${(det?.density_score ?? 0) * 100}%` }}
          />
        </div>
        <span className="text-foreground/80">{((det?.density_score ?? 0) * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}

export function LiveFeedPanel() {
  return (
    <div className="bg-panel border border-panel rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-mono uppercase tracking-wider text-primary">Live Feed</h2>
        <span className="text-[10px] font-mono text-muted-foreground">YOLOv8n · 4 lanes</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {LANES.map((l) => <LaneFeed key={l} lane={l} />)}
      </div>
    </div>
  );
}
