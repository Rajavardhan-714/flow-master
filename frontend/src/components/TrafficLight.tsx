import type { SignalLaneState } from "@/backend/schemas";
import { cn } from "@/lib/utils";

interface Props { lane: string; signal: SignalLaneState; flashing?: boolean }

export function TrafficLight({ lane, signal, flashing }: Props) {
  const total = signal.total ?? 30;
  const remaining = signal.remaining ?? 0;
  const progress = total > 0 ? remaining / total : 0;
  const C = 2 * Math.PI * 22;
  const dashoffset = C * (1 - progress);

  const lights: { color: string; var: string }[] = [
    { color: "RED", var: "--signal-red" },
    { color: "YELLOW", var: "--signal-yellow" },
    { color: "GREEN", var: "--signal-green" },
  ];

  return (
    <div className={cn(
      "relative flex flex-col items-center gap-2 p-3 rounded-md border bg-panel/40 backdrop-blur transition-all duration-300",
      flashing ? "border-signal-yellow animate-emergency-pulse" : "border-panel-border"
    )}>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{lane}</div>
      <div className="relative w-14 h-36 rounded-md bg-black/50 border border-panel-border flex flex-col items-center justify-around py-2">
        {lights.map((l) => {
          const active = signal.state === l.color;
          return (
            <div
              key={l.color}
              className="w-7 h-7 rounded-full transition-all duration-500"
              style={{
                background: `hsl(var(${l.var}))`,
                opacity: active ? 1 : 0.1,
                boxShadow: active 
                  ? `0 0 15px hsl(var(${l.var})), 0 0 40px hsl(var(${l.var}) / 0.6), inset 0 0 10px hsl(var(${l.var}) / 0.5)` 
                  : `inset 0 0 10px rgba(0,0,0,0.8)`,
              }}
            />
          );
        })}
        {/* countdown arc */}
        <svg className="absolute -top-1 -left-1 w-[60px] h-[148px]" viewBox="0 0 60 148">
          <circle cx="30" cy="14" r="22" fill="none" stroke="hsl(var(--panel-border))" strokeWidth="2" />
          <circle
            cx="30" cy="14" r="22" fill="none"
            stroke={`hsl(var(--signal-${signal.state.toLowerCase()}))`}
            strokeWidth="2"
            strokeDasharray={C}
            strokeDashoffset={dashoffset}
            transform="rotate(-90 30 14)"
            style={{ 
              transition: "stroke-dashoffset 0.9s linear, stroke 0.3s ease",
              filter: `drop-shadow(0 0 4px hsl(var(--signal-${signal.state.toLowerCase()})))`
            }}
          />
        </svg>
      </div>
      <div className="font-mono text-xs text-foreground">
        <span className={cn(
          signal.state === "GREEN" && "text-signal-green",
          signal.state === "YELLOW" && "text-signal-yellow",
          signal.state === "RED" && "text-signal-red",
        )}>{signal.state}</span>
        <span className="text-muted-foreground"> · {signal.remaining}s</span>
      </div>
    </div>
  );
}
