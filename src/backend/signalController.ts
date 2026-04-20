import { LANES, type Lane, type SignalLaneState, type SignalState, type OverrideMode } from "./schemas";
import { bus } from "./eventBus";

const BASE_GREEN = 15;
const DENSITY_BONUS = 30;
const MIN_GREEN = 8;
const MAX_GREEN = 60;
const YELLOW_TIME = 3;

function computeGreenTime(density: number) {
  const raw = BASE_GREEN + DENSITY_BONUS * density;
  return Math.max(MIN_GREEN, Math.min(MAX_GREEN, Math.floor(raw)));
}

class SignalController {
  private signals: Record<Lane, SignalLaneState> = {
    north: { state: "GREEN", remaining: 15, total: 15, next_state: "YELLOW" },
    south: { state: "RED", remaining: 18, queued_position: 1 },
    east: { state: "RED", remaining: 21, queued_position: 2 },
    west: { state: "RED", remaining: 24, queued_position: 3 },
  };
  private cycle = 1;
  private overrideMode: OverrideMode = null;
  private manualOverrides: Map<Lane, { state: SignalState; until: number }> = new Map();
  private incidentBlocks = new Set<Lane>();
  private densities: Record<Lane, number> = { north: 0.3, south: 0.3, east: 0.3, west: 0.3 };
  private lastServed: Record<Lane, number> = { north: 0, south: -10, east: -20, west: -30 };
  private interval: number | null = null;
  private tickCount = 0;
  private corridorLanes = new Set<Lane>();

  start() {
    if (this.interval !== null) return;
    this.broadcast();
    this.interval = window.setInterval(() => this.tick(), 1000);
  }

  setDensity(lane: Lane, d: number) { this.densities[lane] = d; }

  setEmergencyOverride(corridor: Lane[], crossingReds: Lane[]) {
    this.overrideMode = "EMERGENCY_OVERRIDE";
    this.corridorLanes = new Set(corridor);
    corridor.forEach((l) => { this.signals[l] = { state: "GREEN", remaining: 99, total: 99 }; });
    crossingReds.forEach((l) => { this.signals[l] = { state: "RED", remaining: 99 }; });
    this.broadcast();
  }

  clearEmergencyOverride() {
    this.overrideMode = null;
    this.corridorLanes.clear();
    // Resume — pick highest density lane next
    LANES.forEach((l, i) => {
      this.signals[l] = i === 0
        ? { state: "GREEN", remaining: 15, total: 15, next_state: "YELLOW" }
        : { state: "RED", remaining: 15 + i * YELLOW_TIME, queued_position: i };
    });
    this.cycle += 1;
    this.broadcast();
  }

  applyManualOverride(lanes: Lane[], state: SignalState, durationSec: number) {
    const until = this.tickCount + durationSec;
    lanes.forEach((l) => {
      this.manualOverrides.set(l, { state, until });
      this.signals[l] = { state, remaining: durationSec, total: durationSec };
    });
    this.overrideMode = "MANUAL_OVERRIDE";
    bus.publish({ type: "override_applied", lanes, state, duration: durationSec, ts: Date.now() / 1000 });
    this.broadcast();
  }

  releaseOverrides(lanes?: Lane[]) {
    (lanes ?? Array.from(this.manualOverrides.keys())).forEach((l) => this.manualOverrides.delete(l));
    if (this.manualOverrides.size === 0 && this.overrideMode === "MANUAL_OVERRIDE") {
      this.overrideMode = null;
    }
    this.broadcast();
  }

  private tick() {
    this.tickCount++;
    if (this.overrideMode === "EMERGENCY_OVERRIDE") {
      this.broadcast();
      return;
    }
    // Expire manual overrides
    for (const [l, ov] of this.manualOverrides.entries()) {
      if (this.tickCount >= ov.until) this.manualOverrides.delete(l);
    }
    if (this.manualOverrides.size === 0 && this.overrideMode === "MANUAL_OVERRIDE") this.overrideMode = null;

    LANES.forEach((lane) => {
      if (this.manualOverrides.has(lane)) {
        const ov = this.manualOverrides.get(lane)!;
        this.signals[lane] = { state: ov.state, remaining: Math.max(0, ov.until - this.tickCount) };
        return;
      }
      const s = this.signals[lane];
      s.remaining = Math.max(0, s.remaining - 1);
      if (s.remaining === 0) this.advance(lane);
    });

    this.broadcast();
  }

  private advance(lane: Lane) {
    const s = this.signals[lane];
    if (s.state === "GREEN") {
      s.state = "YELLOW";
      s.remaining = YELLOW_TIME;
      s.next_state = "RED";
      this.lastServed[lane] = this.tickCount;
    } else if (s.state === "YELLOW") {
      s.state = "RED";
      s.remaining = 0;
      // pick next green
      const next = this.pickNextGreen(lane);
      const g = computeGreenTime(this.densities[next]);
      this.signals[next] = { state: "GREEN", remaining: g, total: g, next_state: "YELLOW" };
      // assign queue positions
      const others = LANES.filter((l) => l !== next && this.signals[l].state !== "GREEN" && this.signals[l].state !== "YELLOW");
      others.forEach((l, i) => {
        this.signals[l] = { state: "RED", remaining: g + (i + 1) * YELLOW_TIME, queued_position: i + 1 };
      });
      this.cycle += 1;
    }
  }

  private pickNextGreen(exclude: Lane): Lane {
    const candidates = LANES.filter((l) => l !== exclude);
    let best: Lane = candidates[0];
    let bestScore = -1;
    candidates.forEach((l) => {
      const wait = this.tickCount - this.lastServed[l];
      const recency = Math.min(1.5, 1 + wait / 60);
      const score = this.densities[l] * recency;
      if (score > bestScore) { bestScore = score; best = l; }
    });
    return best;
  }

  private broadcast() {
    bus.publish({
      type: "signal_state",
      signals: { ...this.signals },
      override_mode: this.overrideMode,
      cycle_number: this.cycle,
      ts: Date.now() / 1000,
    });
  }

  getCycle() { return this.cycle; }
}

export const signalController = new SignalController();
