import { useEffect, useRef, useState } from "react";
import { useTrafficState } from "@/hooks/useTrafficState";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Siren, X } from "lucide-react";
import { triggerEmergency, clearEmergency } from "@/backend/emergency";

export function EmergencyPanel() {
  const emergency = useTrafficState((s) => s.emergency);
  const [muted, setMuted] = useState(false);
  const [eta, setEta] = useState(12);
  const audioCtx = useRef<AudioContext | null>(null);
  const beepInterval = useRef<number | null>(null);

  useEffect(() => {
    if (!emergency) {
      setEta(12);
      if (beepInterval.current) { clearInterval(beepInterval.current); beepInterval.current = null; }
      return;
    }
    setEta(emergency.eta_clear_seconds);
    const tick = setInterval(() => setEta((e) => Math.max(0, e - 1)), 1000);

    if (!muted) {
      try {
        audioCtx.current ??= new AudioContext();
        const beep = () => {
          const ctx = audioCtx.current!;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          osc.connect(gain).connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.22);
        };
        beep();
        beepInterval.current = window.setInterval(beep, 1500);
      } catch {}
    }

    return () => {
      clearInterval(tick);
      if (beepInterval.current) { clearInterval(beepInterval.current); beepInterval.current = null; }
    };
  }, [emergency, muted]);

  return (
    <div className="bg-panel border border-panel rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-mono uppercase tracking-wider text-primary flex items-center gap-2">
          <Siren className="w-4 h-4" /> Emergency Engine
        </h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => triggerEmergency("north", "ambulance", 0.92, "visual")}>
            Test trigger
          </Button>
          {emergency && (
            <Button size="sm" variant="destructive" onClick={() => clearEmergency()}>Clear</Button>
          )}
        </div>
      </div>

      {emergency ? (
        <div className="animate-slide-down rounded-md border border-signal-red bg-signal-red/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="px-2 py-1 rounded bg-signal-red text-destructive-foreground text-xs font-mono font-bold animate-emergency-pulse">
                {emergency.vehicle_type.toUpperCase().replace("_", " ")}
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                lane: {emergency.source_lane.toUpperCase()} · conf {(emergency.confidence * 100).toFixed(0)}% · {emergency.detection_method}
              </span>
            </div>
            <button onClick={() => setMuted((m) => !m)} className="text-muted-foreground hover:text-foreground">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
          {/* Corridor arrow */}
          <svg viewBox="0 0 300 60" className="w-full">
            <line x1="20" y1="30" x2="260" y2="30"
              stroke="hsl(var(--signal-green))" strokeWidth="6"
              strokeDasharray="10 6" className="animate-corridor-dash" />
            <polygon points="260,20 280,30 260,40" fill="hsl(var(--signal-green))" />
            <text x="20" y="20" fill="hsl(var(--foreground))" fontSize="10" fontFamily="JetBrains Mono">
              corridor: {emergency.corridor.join(" → ")}
            </text>
            <text x="20" y="55" fill="hsl(var(--signal-red))" fontSize="10" fontFamily="JetBrains Mono">
              crossing reds: {emergency.crossing_reds.join(", ")}
            </text>
          </svg>
          <div className="text-xs font-mono text-muted-foreground flex items-center gap-2">
            ETA clear: <span className="text-signal-yellow text-base">{eta}s</span>
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-panel-border p-6 text-center text-xs font-mono text-muted-foreground">
          <X className="w-4 h-4 inline mr-1 opacity-50" />
          No active emergency · monitoring all lanes
        </div>
      )}
    </div>
  );
}
