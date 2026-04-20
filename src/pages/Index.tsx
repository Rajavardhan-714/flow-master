import { useEventBus } from "@/hooks/useEventBus";
import { LiveFeedPanel } from "@/components/LiveFeedPanel";
import { SignalPanel } from "@/components/SignalPanel";
import { EmergencyPanel } from "@/components/EmergencyPanel";
import { AnalyticsPanel } from "@/components/AnalyticsPanel";
import { MapView } from "@/components/MapView";
import { SimulationControls } from "@/components/SimulationControls";
import { OverridePanel } from "@/components/OverridePanel";
import { useTrafficState } from "@/hooks/useTrafficState";

const Index = () => {
  useEventBus();
  const scenario = useTrafficState((s) => s.scenario);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-panel-border px-6 py-3 flex items-center justify-between bg-panel/40 backdrop-blur sticky top-0 z-20">
        <div>
          <h1 className="text-lg font-mono font-bold tracking-tight">
            <span className="text-primary">SmartFlow</span> AI
          </h1>
          <p className="text-[11px] font-mono text-muted-foreground">Intelligent streets. Zero new infrastructure.</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
          <span className="px-2 py-1 rounded-full bg-primary/15 text-primary uppercase">{scenario}</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-signal-green animate-pulse" />
            BUS ONLINE
          </span>
        </div>
      </header>

      <main className="p-4 grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="grid gap-4 lg:grid-cols-2">
          <LiveFeedPanel />
          <SignalPanel />
          <EmergencyPanel />
          <AnalyticsPanel />
          <div className="lg:col-span-2"><MapView /></div>
        </div>
        <aside className="grid gap-4 content-start">
          <SimulationControls />
          <OverridePanel />
        </aside>
      </main>
    </div>
  );
};

export default Index;
