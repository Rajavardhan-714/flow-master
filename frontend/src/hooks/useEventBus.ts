import { useEffect } from "react";
import { bus } from "@/backend/eventBus";
import { bootBackend } from "@/backend";
import { useTrafficState } from "./useTrafficState";

export function useEventBus() {
  const setSignals = useTrafficState((s) => s.setSignals);
  const setDetection = useTrafficState((s) => s.setDetection);
  const setPrediction = useTrafficState((s) => s.setPrediction);
  const setEmergency = useTrafficState((s) => s.setEmergency);
  const setScenario = useTrafficState((s) => s.setScenario);
  const pushAudit = useTrafficState((s) => s.pushAudit);

  useEffect(() => {
    bootBackend();
    const off = bus.subscribe((msg) => {
      switch (msg.type) {
        case "signal_state": setSignals(msg.signals, msg.override_mode, msg.cycle_number); break;
        case "detection_result": setDetection(msg.detection); break;
        case "prediction": setPrediction(msg.predictions, {
          generatedAt: msg.generated_at, recommendation: msg.recommendation,
          peakLane: msg.peak_lane, confidence: msg.confidence,
        }); break;
        case "emergency_active": setEmergency(msg); break;
        case "emergency_cleared": setEmergency(null); break;
        case "scenario_started": setScenario(msg.scenario, msg.speed); break;
        case "override_applied": pushAudit({
          ts: msg.ts, lanes: msg.lanes, state: msg.state, duration: msg.duration,
        }); break;
      }
    });
    return () => { off(); };
  }, [setSignals, setDetection, setPrediction, setEmergency, setScenario, pushAudit]);
}
