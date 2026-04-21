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
    <div className="relative bg-black/40 backdrop-blur-sm border border-panel-border/50 rounded-md overflow-hidden aspect-video group cursor-crosshair transition-all duration-300 hover:scale-[1.02] hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,229,255,0.15)]">
      <div className="absolute top-1 left-2 text-[10px] font-mono text-primary/80 uppercase tracking-wider z-10 drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]">
        {lane} · YOLOV8
      </div>
      <svg viewBox="0 0 100 56" className="w-full h-full opacity-80 mix-blend-screen">
        <rect width="100" height="56" fill="transparent" />
        {det?.bounding_boxes.slice(0, 12).map((b, i) => (
          <rect
            key={i}
            x={b.x1 * 100} y={b.y1 * 56}
            width={(b.x2 - b.x1) * 100} height={(b.y2 - b.y1) * 56}
            fill="none" stroke={LANE_COLORS[b.cls] ?? "white"} strokeWidth="0.4"
          />
        ))}
      </svg>
      <div className="absolute bottom-1 left-2 right-2 flex items-center gap-2 text-[10px] font-mono z-10">
        <div className="flex-1 h-1 bg-panel-border/50 rounded overflow-hidden">
          <div
            className={cn("h-full rounded transition-all duration-500", densityClass(det?.density_score ?? 0))}
            style={{ 
              width: `${(det?.density_score ?? 0) * 100}%`,
              boxShadow: `0 0 10px currentColor` 
            }}
          />
        </div>
        <span className="text-foreground/90 font-bold drop-shadow-md">{((det?.density_score ?? 0) * 100).toFixed(0)}%</span>
      </div>
      {/* Ambient glass gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
    </div>
  );
}

export function LiveFeedPanel() {
  return (
    <div className="bg-panel/40 backdrop-blur border border-panel-border rounded-lg p-4 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-mono uppercase tracking-wider text-primary drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]">Live Feed</h2>
        <span className="text-[10px] font-mono text-muted-foreground bg-black/40 px-2 py-1 rounded-full border border-panel-border">YOLOv8n · 4 lanes</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {LANES.map((l) => <LaneFeed key={l} lane={l} />)}
      </div>
    </div>
  );
}
