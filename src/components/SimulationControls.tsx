import { useTrafficState } from "@/hooks/useTrafficState";
import { simulator, SCENARIOS, type ScenarioId } from "@/backend/simulator";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function SimulationControls() {
  const scenario = useTrafficState((s) => s.scenario);
  const speed = useTrafficState((s) => s.speed);

  return (
    <div className="bg-panel border border-panel rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-mono uppercase tracking-wider text-primary">Simulation</h2>
        <span className="px-2 py-1 rounded-full bg-primary/15 text-primary text-[10px] font-mono uppercase">
          {scenario} · {speed}×
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {SCENARIOS.map((sc) => (
          <Button
            key={sc.id}
            variant={scenario === sc.id ? "default" : "outline"}
            size="sm"
            className={cn("justify-start text-xs h-auto py-2", scenario === sc.id && "ring-1 ring-primary")}
            onClick={() => simulator.setScenario(sc.id as ScenarioId)}
          >
            <div className="flex flex-col items-start">
              <span className="font-mono">{sc.name}</span>
              <span className="text-[10px] opacity-70 truncate w-full text-left">{sc.description}</span>
            </div>
          </Button>
        ))}
      </div>
      <div>
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
          <span>SPEED</span><span>{speed}×</span>
        </div>
        <Slider
          min={1} max={5} step={1} value={[speed]}
          onValueChange={(v) => { simulator.setSpeed(v[0]); useTrafficState.setState({ speed: v[0] }); }}
        />
      </div>
    </div>
  );
}
