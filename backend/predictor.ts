import { LANES, type Lane, type PredictionPoint } from "./schemas";
import { bus } from "./eventBus";

const MAX_POINTS = 180; // 15 min @ 5s
const buffers: Record<Lane, { t: number; d: number }[]> = {
  north: [], south: [], east: [], west: [],
};

export function recordDensity(lane: Lane, density: number) {
  const arr = buffers[lane];
  arr.push({ t: Date.now() / 1000, d: density });
  if (arr.length > MAX_POINTS) arr.shift();
}

function linearFit(points: { t: number; d: number }[]) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.d ?? 0 };
  const t0 = points[0].t;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (const p of points) {
    const x = p.t - t0;
    sumX += x; sumY += p.d; sumXY += x * p.d; sumXX += x * x;
  }
  const denom = n * sumXX - sumX * sumX || 1;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function todMultiplier() {
  const h = new Date().getHours();
  if ((h >= 7 && h <= 9) || (h >= 17 && h <= 19)) return 1.15;
  if (h >= 22 || h <= 5) return 0.7;
  return 1.0;
}

export function generatePrediction() {
  const lastN = (n: number) => (arr: { t: number; d: number }[]) => arr.slice(-n);
  const recent = (lane: Lane) => lastN(60)(buffers[lane]);
  const last = (lane: Lane) => buffers[lane][buffers[lane].length - 1]?.d ?? 0.3;

  const fits: Record<Lane, { slope: number; intercept: number; base: number }> = {} as any;
  LANES.forEach((l) => {
    const pts = recent(l);
    const fit = linearFit(pts);
    fits[l] = { ...fit, base: last(l) };
  });

  const mult = todMultiplier();
  const predictions: PredictionPoint[] = [];
  for (let m = 1; m <= 5; m++) {
    const point: PredictionPoint = { minute: m, north: 0, south: 0, east: 0, west: 0 };
    LANES.forEach((l) => {
      const f = fits[l];
      let v = f.base + f.slope * (m * 60);
      v = Math.max(0, Math.min(1, v * mult));
      (point as any)[l] = Number(v.toFixed(3));
    });
    predictions.push(point);
  }

  // peak
  let peakLane: Lane = "north"; let peakMin = 1; let peakVal = 0;
  predictions.forEach((p) => {
    LANES.forEach((l) => {
      if (p[l] > peakVal) { peakVal = p[l]; peakLane = l; peakMin = p.minute; }
    });
  });

  const recommendation = peakVal > 0.7
    ? `Extend ${peakLane} green by ${Math.round(peakVal * 20)} s over next 3 cycles`
    : peakVal > 0.5
      ? `Monitor ${peakLane} — congestion building`
      : "Traffic stable — no action needed";

  bus.publish({
    type: "prediction",
    generated_at: new Date().toLocaleTimeString(),
    predictions,
    peak_lane: peakLane,
    peak_minute: peakMin,
    recommendation,
    confidence: buffers.north.length > 30 ? "medium" : "low",
  });
}

let interval: number | null = null;
export function startPredictor() {
  if (interval !== null) return;
  setTimeout(() => generatePrediction(), 2000);
  interval = window.setInterval(() => generatePrediction(), 30000);
}
