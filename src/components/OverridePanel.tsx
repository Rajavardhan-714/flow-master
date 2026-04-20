import { useState } from "react";
import { useTrafficState } from "@/hooks/useTrafficState";
import { signalController } from "@/backend/signalController";
import { LANES, type Lane, type SignalState } from "@/backend/schemas";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function OverridePanel() {
  const audit = useTrafficState((s) => s.audit);
  const [selected, setSelected] = useState<Set<Lane>>(new Set());
  const [duration, setDuration] = useState(30);

  const toggle = (l: Lane) => {
    const next = new Set(selected);
    next.has(l) ? next.delete(l) : next.add(l);
    setSelected(next);
  };

  const apply = (state: SignalState) => {
    if (selected.size === 0) return;
    signalController.applyManualOverride(Array.from(selected), state, duration);
  };

  const release = () => {
    signalController.releaseOverrides(Array.from(selected));
    setSelected(new Set());
  };

  return (
    <div className="bg-panel border border-panel rounded-lg p-4">
      <h2 className="text-sm font-mono uppercase tracking-wider text-primary mb-3">Manual Override</h2>
      <div className="flex gap-1 mb-3">
        {LANES.map((l) => (
          <button
            key={l}
            onClick={() => toggle(l)}
            className={cn(
              "flex-1 px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors border",
              selected.has(l)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-muted-foreground border-panel-border hover:text-foreground"
            )}
          >{l[0]}</button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Button size="sm" className="bg-signal-green hover:bg-signal-green/90 text-black" onClick={() => apply("GREEN")}>GREEN</Button>
        <Button size="sm" className="bg-signal-yellow hover:bg-signal-yellow/90 text-black" onClick={() => apply("YELLOW")}>YELLOW</Button>
        <Button size="sm" className="bg-signal-red hover:bg-signal-red/90 text-white" onClick={() => apply("RED")}>RED</Button>
      </div>
      <div className="mb-3">
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
          <span>DURATION</span><span>{duration}s</span>
        </div>
        <Slider min={10} max={120} step={5} value={[duration]} onValueChange={(v) => setDuration(v[0])} />
      </div>
      <div className="flex gap-2 mb-4">
        <Button size="sm" variant="outline" className="flex-1" onClick={release}>Release</Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={() => signalController.releaseOverrides()}>Release all</Button>
      </div>
      <div>
        <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Audit log</div>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {audit.length === 0 && <div className="text-[10px] font-mono text-muted-foreground/60">No overrides yet</div>}
          {audit.map((a, i) => (
            <div key={i} className="text-[10px] font-mono text-muted-foreground border-b border-panel-border pb-1">
              {new Date(a.ts * 1000).toLocaleTimeString()} · {a.lanes.join(",")} → {a.state} · {a.duration}s
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
