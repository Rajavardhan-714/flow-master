import { LANES, type DetectionResult, type Lane } from "./schemas";
import { bus } from "./eventBus";

export type ScenarioId =
  | "normal" | "morning_rush" | "evening_rush" | "heavy_all"
  | "emergency" | "incident" | "night";

export const SCENARIOS: { id: ScenarioId; name: string; description: string }[] = [
  { id: "normal", name: "Normal", description: "All lanes 0.25–0.45, slow sine variation" },
  { id: "morning_rush", name: "Morning rush", description: "N+S spike to 0.85, E+W at 0.40" },
  { id: "evening_rush", name: "Evening rush", description: "E+W spike to 0.80, N+S at 0.50" },
  { id: "heavy_all", name: "Full congestion", description: "All lanes 0.80–0.95" },
  { id: "emergency", name: "Emergency arrival", description: "Normal traffic, ambulance on North" },
  { id: "incident", name: "Lane incident", description: "West blocks after 10s" },
  { id: "night", name: "Night mode", description: "All lanes 0.05–0.15" },
];

const LANE_PHASE: Record<Lane, number> = { north: 0, south: Math.PI, east: Math.PI / 2, west: -Math.PI / 2 };
const LANE_CAPACITY = 20;

interface ScenarioConfig {
  baseDensity: Record<Lane, [number, number]>; // [min, max]
  emergencyAt?: { t: number; lane: Lane; vehicle: "ambulance" | "fire_truck" };
  incidentAt?: { t: number; lane: Lane };
}

const CONFIGS: Record<ScenarioId, ScenarioConfig> = {
  normal: { baseDensity: { north: [0.25, 0.45], south: [0.25, 0.45], east: [0.25, 0.45], west: [0.25, 0.45] } },
  morning_rush: { baseDensity: { north: [0.65, 0.85], south: [0.65, 0.85], east: [0.30, 0.45], west: [0.30, 0.45] } },
  evening_rush: { baseDensity: { north: [0.40, 0.55], south: [0.40, 0.55], east: [0.65, 0.80], west: [0.65, 0.80] } },
  heavy_all: { baseDensity: { north: [0.80, 0.95], south: [0.80, 0.95], east: [0.80, 0.95], west: [0.80, 0.95] } },
  emergency: {
    baseDensity: { north: [0.30, 0.45], south: [0.30, 0.45], east: [0.30, 0.45], west: [0.30, 0.45] },
    emergencyAt: { t: 5, lane: "north", vehicle: "ambulance" },
  },
  incident: {
    baseDensity: { north: [0.35, 0.55], south: [0.35, 0.55], east: [0.35, 0.55], west: [0.35, 0.55] },
    incidentAt: { t: 10, lane: "west" },
  },
  night: { baseDensity: { north: [0.05, 0.15], south: [0.05, 0.15], east: [0.05, 0.15], west: [0.05, 0.15] } },
};

function levelFor(d: number): "low" | "medium" | "high" {
  if (d < 0.4) return "low";
  if (d < 0.7) return "medium";
  return "high";
}

function makeDetection(lane: Lane, density: number, frameId: number): DetectionResult {
  const weighted = density * LANE_CAPACITY;
  const cars = Math.floor(weighted * 0.5);
  const motorcycles = Math.floor(weighted * 0.25 / 0.5);
  const buses = Math.floor(weighted * 0.1 / 2.5);
  const trucks = Math.floor(weighted * 0.15 / 2.0);
  const boxes = Array.from({ length: cars + motorcycles + buses + trucks }, (_, i) => {
    const x1 = Math.random() * 0.8;
    const y1 = Math.random() * 0.8;
    return {
      cls: i < cars ? "car" : i < cars + motorcycles ? "motorcycle" : i < cars + motorcycles + buses ? "bus" : "truck",
      x1, y1, x2: x1 + 0.08 + Math.random() * 0.1, y2: y1 + 0.08 + Math.random() * 0.1,
      conf: 0.6 + Math.random() * 0.35, lane,
    };
  });
  return {
    lane, frame_id: frameId, timestamp: Date.now() / 1000,
    counts: { car: cars, motorcycle: motorcycles, bus: buses, truck: trucks },
    weighted_count: weighted, density_score: density,
    congestion_level: levelFor(density),
    emergency_detected: false, emergency_type: null,
    bounding_boxes: boxes, processing_ms: 50 + Math.random() * 40,
  };
}

class Simulator {
  private scenario: ScenarioId = "normal";
  private speed = 1;
  private startedAt = Date.now();
  private interval: number | null = null;
  private frameId = 0;
  private blockedLanes = new Set<Lane>();
  private emergencyFired = false;

  start() {
    if (this.interval !== null) return;
    this.tick();
    this.interval = window.setInterval(() => this.tick(), 1000);
  }

  setScenario(id: ScenarioId) {
    this.scenario = id;
    this.startedAt = Date.now();
    this.frameId = 0;
    this.blockedLanes.clear();
    this.emergencyFired = false;
    bus.publish({ type: "scenario_started", scenario: id, speed: this.speed });
  }

  setSpeed(s: number) { this.speed = s; }
  getScenario() { return this.scenario; }
  getSpeed() { return this.speed; }

  private tick() {
    const cfg = CONFIGS[this.scenario];
    const elapsed = ((Date.now() - this.startedAt) / 1000) * this.speed;

    // Incident: drop a lane to 0 after t seconds
    if (cfg.incidentAt && elapsed >= cfg.incidentAt.t) {
      this.blockedLanes.add(cfg.incidentAt.lane);
    }

    // Emergency injection
    if (cfg.emergencyAt && !this.emergencyFired && elapsed >= cfg.emergencyAt.t) {
      this.emergencyFired = true;
      import("./emergency").then(({ triggerEmergency }) => {
        triggerEmergency(cfg.emergencyAt!.lane, cfg.emergencyAt!.vehicle, 0.87, "visual");
      });
    }

    LANES.forEach((lane) => {
      let density: number;
      if (this.blockedLanes.has(lane)) {
        density = 0;
      } else {
        const [lo, hi] = cfg.baseDensity[lane];
        const mid = (lo + hi) / 2;
        const amp = (hi - lo) / 2;
        // sine 120s period, lane phase, plus random spike
        const sine = Math.sin((elapsed * 2 * Math.PI) / 120 + LANE_PHASE[lane]);
        const spike = Math.random() < 0.03 ? Math.random() * 0.15 : 0;
        density = Math.max(0, Math.min(1, mid + amp * sine + spike));
      }
      this.frameId++;
      const det = makeDetection(lane, density, this.frameId);
      bus.publish({ type: "detection_result", detection: det });
    });
  }
}

export const simulator = new Simulator();
