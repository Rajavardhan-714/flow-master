// Shared types matching the Pydantic schemas in the FastAPI spec.
export type Lane = "north" | "south" | "east" | "west";
export type SignalState = "RED" | "GREEN" | "YELLOW";
export type CongestionLevel = "low" | "medium" | "high";
export type OverrideMode = null | "EMERGENCY_OVERRIDE" | "MANUAL_OVERRIDE" | "INCIDENT_BLOCK";

export const LANES: Lane[] = ["north", "south", "east", "west"];

export interface BBox {
  cls: string;
  x1: number; y1: number; x2: number; y2: number;
  conf: number;
  lane: Lane;
}

export interface DetectionResult {
  lane: Lane;
  frame_id: number;
  timestamp: number;
  counts: { car: number; motorcycle: number; bus: number; truck: number };
  weighted_count: number;
  density_score: number;
  congestion_level: CongestionLevel;
  emergency_detected: boolean;
  emergency_type: "ambulance" | "fire_truck" | null;
  bounding_boxes: BBox[];
  processing_ms: number;
}

export interface SignalLaneState {
  state: SignalState;
  remaining: number;
  next_state?: SignalState;
  queued_position?: number;
  total?: number;
}

export interface SignalStateMessage {
  type: "signal_state";
  signals: Record<Lane, SignalLaneState>;
  override_mode: OverrideMode;
  cycle_number: number;
  ts: number;
}

export interface PredictionPoint {
  minute: number;
  north: number; south: number; east: number; west: number;
}

export interface PredictionMessage {
  type: "prediction";
  generated_at: string;
  predictions: PredictionPoint[];
  peak_lane: Lane;
  peak_minute: number;
  recommendation: string;
  confidence: "low" | "medium" | "high";
}

export interface EmergencyActiveMessage {
  type: "emergency_active";
  vehicle_type: "ambulance" | "fire_truck";
  source_lane: Lane;
  confidence: number;
  corridor: Lane[];
  crossing_reds: Lane[];
  eta_clear_seconds: number;
  detection_method: "visual" | "audio";
  ts: number;
}

export interface EmergencyClearedMessage {
  type: "emergency_cleared";
  duration_seconds: number;
  resuming_cycle: number;
  ts: number;
}

export interface DetectionMessage {
  type: "detection_result";
  detection: DetectionResult;
}

export interface ScenarioStartedMessage {
  type: "scenario_started";
  scenario: string;
  speed: number;
}

export interface OverrideAppliedMessage {
  type: "override_applied";
  lanes: Lane[];
  state: SignalState;
  duration: number;
  ts: number;
}

export type BusMessage =
  | SignalStateMessage
  | PredictionMessage
  | EmergencyActiveMessage
  | EmergencyClearedMessage
  | DetectionMessage
  | ScenarioStartedMessage
  | OverrideAppliedMessage;
