import { create } from "zustand";
import type {
  DetectionResult, Lane, OverrideMode, PredictionPoint, SignalLaneState, EmergencyActiveMessage,
} from "@/backend/schemas";

interface AuditEntry {
  ts: number; lanes: Lane[]; state: string; duration: number;
}

interface TrafficState {
  signals: Record<Lane, SignalLaneState>;
  overrideMode: OverrideMode;
  cycle: number;
  detections: Record<Lane, DetectionResult | null>;
  trends: { time: string; north: number; south: number; east: number; west: number }[];
  predictions: PredictionPoint[];
  predictionMeta: { generatedAt: string; recommendation: string; peakLane: Lane; confidence: string } | null;
  emergency: EmergencyActiveMessage | null;
  scenario: string;
  speed: number;
  audit: AuditEntry[];
  totalVehicles: number;
  emergencyCount: number;
  setSignals: (s: Record<Lane, SignalLaneState>, mode: OverrideMode, cycle: number) => void;
  setDetection: (d: DetectionResult) => void;
  setPrediction: (p: PredictionPoint[], meta: TrafficState["predictionMeta"]) => void;
  setEmergency: (e: EmergencyActiveMessage | null) => void;
  setScenario: (s: string, speed: number) => void;
  pushAudit: (e: AuditEntry) => void;
}

const AUDIT_KEY = "smartflow_audit";
const loadAudit = (): AuditEntry[] => {
  try { return JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]"); } catch { return []; }
};

export const useTrafficState = create<TrafficState>((set, get) => ({
  signals: {
    north: { state: "GREEN", remaining: 15 }, south: { state: "RED", remaining: 18 },
    east: { state: "RED", remaining: 21 }, west: { state: "RED", remaining: 24 },
  },
  overrideMode: null, cycle: 1,
  detections: { north: null, south: null, east: null, west: null },
  trends: [],
  predictions: [], predictionMeta: null,
  emergency: null,
  scenario: "normal", speed: 1,
  audit: loadAudit(),
  totalVehicles: 0, emergencyCount: 0,
  setSignals: (signals, overrideMode, cycle) => set({ signals, overrideMode, cycle }),
  setDetection: (d) => {
    const cur = get();
    const detections = { ...cur.detections, [d.lane]: d };
    // Update trends rolling window every ~5s by using N/E only when north tick
    let trends = cur.trends;
    if (d.lane === "north") {
      const time = new Date().toLocaleTimeString().slice(0, 8);
      trends = [...cur.trends, {
        time,
        north: detections.north?.density_score ?? 0,
        south: detections.south?.density_score ?? 0,
        east: detections.east?.density_score ?? 0,
        west: detections.west?.density_score ?? 0,
      }].slice(-180);
    }
    const totalNew = Object.values(d.counts).reduce((a, b) => a + b, 0);
    set({ detections, trends, totalVehicles: cur.totalVehicles + totalNew });
  },
  setPrediction: (predictions, predictionMeta) => set({ predictions, predictionMeta }),
  setEmergency: (e) => set((s) => ({ emergency: e, emergencyCount: e ? s.emergencyCount + 1 : s.emergencyCount })),
  setScenario: (scenario, speed) => set({ scenario, speed }),
  pushAudit: (entry) => {
    const audit = [entry, ...get().audit].slice(0, 10);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(audit));
    set({ audit });
  },
}));
