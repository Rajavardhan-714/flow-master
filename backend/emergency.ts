import type { Lane } from "./schemas";
import { bus } from "./eventBus";
import { signalController } from "./signalController";

const OPPOSITE: Record<Lane, Lane> = { north: "south", south: "north", east: "west", west: "east" };
const CROSSING: Record<Lane, Lane[]> = {
  north: ["east", "west"], south: ["east", "west"],
  east: ["north", "south"], west: ["north", "south"],
};

let activeEmergency: {
  lane: Lane; vehicle: "ambulance" | "fire_truck"; startedAt: number;
} | null = null;
let clearTimer: number | null = null;

export function triggerEmergency(
  lane: Lane,
  vehicle: "ambulance" | "fire_truck",
  confidence = 0.85,
  method: "visual" | "audio" = "visual",
) {
  if (activeEmergency) return;
  const corridor: Lane[] = [lane, OPPOSITE[lane]];
  const crossingReds = CROSSING[lane];
  activeEmergency = { lane, vehicle, startedAt: Date.now() };
  signalController.setEmergencyOverride(corridor, crossingReds);
  bus.publish({
    type: "emergency_active",
    vehicle_type: vehicle,
    source_lane: lane,
    confidence,
    corridor,
    crossing_reds: crossingReds,
    eta_clear_seconds: 12,
    detection_method: method,
    ts: Date.now() / 1000,
  });
  // auto-clear after 14s if not manually cleared
  clearTimer = window.setTimeout(() => clearEmergency(), 14000);
}

export function clearEmergency() {
  if (!activeEmergency) return;
  if (clearTimer !== null) { clearTimeout(clearTimer); clearTimer = null; }
  const duration = Math.round((Date.now() - activeEmergency.startedAt) / 1000);
  activeEmergency = null;
  signalController.clearEmergencyOverride();
  bus.publish({
    type: "emergency_cleared",
    duration_seconds: duration,
    resuming_cycle: signalController.getCycle(),
    ts: Date.now() / 1000,
  });
}

export function getActiveEmergency() { return activeEmergency; }
