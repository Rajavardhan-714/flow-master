import { useTrafficState } from "@/hooks/useTrafficState";
import { LANES } from "@/backend/schemas";
import { TrafficLight } from "./TrafficLight";
import { IntersectionMap } from "./IntersectionMap";

export function SignalPanel() {
  const signals = useTrafficState((s) => s.signals);
  const overrideMode = useTrafficState((s) => s.overrideMode);
  const cycle = useTrafficState((s) => s.cycle);
  const emergency = useTrafficState((s) => s.emergency);

  return (
    <div className="bg-panel border border-panel rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-mono uppercase tracking-wider text-primary">Adaptive Signals</h2>
        <span className="text-[10px] font-mono text-muted-foreground">
          cycle #{cycle} · {overrideMode ?? "AUTO"}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_1fr] gap-4">
        <div className="grid grid-cols-2 gap-2">
          {LANES.map((l) => (
            <TrafficLight key={l} lane={l} signal={signals[l]} flashing={!!emergency} />
          ))}
        </div>
        <div className="aspect-square bg-background border border-panel rounded-md overflow-hidden">
          <IntersectionMap />
        </div>
      </div>
    </div>
  );
}
