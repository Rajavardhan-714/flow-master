
The user has uploaded the original FastAPI/Redis/YOLO backend generator scripts plus a docker-compose.yml, and says "make it according to these existing one." Since Lovable can only build client-side React/TS apps (no FastAPI, Redis, Python, or Docker), I'll port the behavior of these scripts into the browser while preserving the exact data shapes, WebSocket message contracts, and UI structure shown in `generate_frontend_part2.py`.

## Approach

Build a **frontend-only SmartFlow AI dashboard** that mirrors the uploaded scripts 1:1 in look and behavior. A browser-side "mock backend" (TypeScript modules) will replicate the FastAPI services and broadcast through an in-memory event bus that mimics the WebSocket contract, so every component reads the same `signal_state`, `prediction`, `emergency_active`, etc. messages defined in the spec.

## What gets built

**Mock backend (src/backend/)** — direct ports of the Python modules:
- `signalController.ts` — FSM with 1Hz tick, BASE_GREEN=15, DENSITY_BONUS=30, priority queue with recency weight, override modes
- `simulator.ts` — 7 scenarios (normal, morning_rush, evening_rush, heavy_all, emergency, incident, night) with sine + spike density generator
- `emergency.ts` — corridor sequencing (source GREEN, crossings RED, downstream preempt, hold→clear→resume)
- `predictor.ts` — 15-min rolling buffer, linear regression forecast, time-of-day correction, 30s refresh
- `eventBus.ts` — pub/sub replacing WebSocket, same message `type` discriminator
- `schemas.ts` — TS types matching the Pydantic models exactly

**Zustand store (src/hooks/)**:
- `useTrafficState.ts` — signals, densities, predictions, emergency, overrideMode (matches uploaded JS version)
- `useEventBus.ts` — subscribes to mock backend, routes by message type (replaces useWebSocket.js)

**UI panels (src/components/)** — port the JSX from `generate_frontend_part2.py`:
- `LiveFeedPanel` — black "DUMMY_DETECTOR ACTIVE" feed with animated mock bounding boxes + 4 density bars
- `SignalPanel` — 4 traffic lights (3 circles each, active=full opacity, inactive=15%) + countdown arc + intersection SVG
- `EmergencyPanel` — slide-in alert banner, vehicle badge, animated corridor arrow, 880Hz Web Audio beep with mute, ETA countdown
- `AnalyticsPanel` — 3 pill tabs: Live trends (Recharts LineChart, 15-min window), 5-min forecast (dashed lines), Stat cards (2×2)
- `MapView` — Leaflet map at Bengaluru coords, 4 CircleMarkers sized by density, animated dashed Polyline for emergency path, marker/heatmap toggle
- `SimulationControls` — 7 scenario buttons + speed slider (1×/2×/5×) + active scenario pill
- `OverridePanel` — lane multi-select, force GREEN/YELLOW/RED, duration slider 10–120s, release buttons, audit log (last 10, localStorage)

**Layout (src/pages/Index.tsx)**: 2×2 panel grid + sidebar, dark control-room theme matching the uploaded JSX (gray-900 bg, gray-800 panels, mono fonts, neon accents).

## Design system (src/index.css + tailwind.config.ts)

Dark control-room palette using HSL semantic tokens:
- Background: deep slate, panels one shade lighter, borders subtle
- Density colors: teal (low) → amber (medium) → coral-red (high) per spec hex `#22c55e / #EF9F27 / #E24B4A`
- JetBrains Mono for numeric/status text, Inter for body
- Pulse + slide animations for emergency banner, dash-offset animation for corridor arrows

## What's intentionally adapted

- **No Docker/FastAPI/Redis/YOLO** — replaced with browser modules and synthetic data (the spec already defines a `DummyDetector` fallback that produces identical shapes; we use that path)
- **No real WebSocket** — in-process event bus emits the same JSON messages with a 50–90ms simulated delay so the contract is preserved
- **No persistence** by default; audit log uses localStorage (matches spec)
- **Recharts + react-leaflet** added as dependencies (Recharts already present)

## Out of scope

Real YOLOv8 inference, real webcam detection, real audio FFT siren detection, multi-client sync. The architecture is structured so a real FastAPI backend could later replace `eventBus.ts` with a real WebSocket without touching any UI component.

## File plan

```
src/
├── backend/
│   ├── schemas.ts
│   ├── eventBus.ts
│   ├── simulator.ts
│   ├── signalController.ts
│   ├── emergency.ts
│   ├── predictor.ts
│   └── index.ts            (boot: starts FSM + predictor + default scenario)
├── hooks/
│   ├── useTrafficState.ts
│   └── useEventBus.ts
├── components/
│   ├── LiveFeedPanel.tsx
│   ├── SignalPanel.tsx
│   ├── TrafficLight.tsx
│   ├── IntersectionMap.tsx
│   ├── EmergencyPanel.tsx
│   ├── AnalyticsPanel.tsx
│   ├── MapView.tsx
│   ├── SimulationControls.tsx
│   └── OverridePanel.tsx
├── pages/Index.tsx         (2×2 grid + sidebar layout)
├── index.css               (dark control-room tokens)
└── tailwind.config.ts      (extended palette + animations)
```

After build I'll verify the preview renders all four panels, signals cycle, scenario switching works, and the emergency trigger plays the corridor animation.
