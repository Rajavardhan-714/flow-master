import { useTrafficState } from "@/hooks/useTrafficState";
import { simulator, SCENARIOS, type ScenarioId } from "@/backend/simulator";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function SimulationControls() {
  const scenario = useTrafficState((s) => s.scenario);
  const speed = useTrafficState((s) => s.speed);

  return (
    <div className="bg-panel/40 backdrop-blur border border-panel-border rounded-lg p-4 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-mono uppercase tracking-wider text-primary drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]">Simulation</h2>
        <span className="px-2 py-1 rounded-full bg-primary/15 text-primary text-[10px] font-mono uppercase">
          {scenario} · {speed}×
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {SCENARIOS.map((sc) => (
          <Button
            key={sc.id}
            variant="outline"
            size="sm"
            className={cn(
              "justify-start text-xs h-auto py-2 whitespace-normal transition-all duration-300", 
              scenario === sc.id 
                ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(0,229,255,0.3)]" 
                : "bg-panel/30 border-panel-border hover:border-primary/50 text-foreground"
            )}
            onClick={() => simulator.setScenario(sc.id as ScenarioId)}
          >
            <div className="flex flex-col items-start text-left w-full">
              <span className="font-mono font-bold font-sm">{sc.name}</span>
              <span className="text-[9px] opacity-70 mt-1 leading-tight break-words font-sans">{sc.description}</span>
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
