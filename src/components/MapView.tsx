import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from "react-leaflet";
import { useTrafficState } from "@/hooks/useTrafficState";
import { LANES, type Lane } from "@/backend/schemas";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

const CENTER: [number, number] = [12.9716, 77.5946];
const OFFSETS: Record<Lane, [number, number]> = {
  north: [12.9726, 77.5946], south: [12.9706, 77.5946],
  east: [12.9716, 77.5956], west: [12.9716, 77.5936],
};

function colorFor(d: number) {
  if (d < 0.4) return "#14b8a6";
  if (d < 0.7) return "#EF9F27";
  return "#E24B4A";
}

export function MapView() {
  const detections = useTrafficState((s) => s.detections);
  const emergency = useTrafficState((s) => s.emergency);
  const [mode, setMode] = useState<"markers" | "heat" | "both">("both");
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  return (
    <div className="bg-panel border border-panel rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-mono uppercase tracking-wider text-primary">Live Map · Bengaluru</h2>
        <div className="flex gap-1">
          {(["markers", "heat", "both"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-2 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider",
                mode === m ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              )}
            >{m}</button>
          ))}
        </div>
      </div>
      <div className="h-72 rounded-md overflow-hidden border border-panel-border">
        {ready && (
          <MapContainer center={CENTER} zoom={16} className="h-full w-full" scrollWheelZoom={false}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {(mode === "markers" || mode === "both") && LANES.map((l) => {
              const d = detections[l]?.density_score ?? 0;
              return (
                <CircleMarker
                  key={l}
                  center={OFFSETS[l]}
                  radius={8 + d * 16}
                  pathOptions={{ color: colorFor(d), fillColor: colorFor(d), fillOpacity: 0.5 }}
                >
                  <Popup>
                    <div style={{ fontFamily: "monospace", fontSize: 11 }}>
                      <b>{l.toUpperCase()}</b><br />
                      Density: {(d * 100).toFixed(0)}%<br />
                      Vehicles: {detections[l] ? Object.values(detections[l]!.counts).reduce((a, b) => a + b, 0) : 0}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
            {(mode === "heat" || mode === "both") && LANES.map((l) => {
              const d = detections[l]?.density_score ?? 0;
              return (
                <CircleMarker
                  key={`h-${l}`} center={OFFSETS[l]}
                  radius={30 + d * 50}
                  pathOptions={{ color: "transparent", fillColor: colorFor(d), fillOpacity: 0.15 }}
                />
              );
            })}
            {emergency && (
              <Polyline
                positions={[OFFSETS[emergency.corridor[0]], OFFSETS[emergency.corridor[1]]]}
                pathOptions={{ color: "#22c55e", weight: 5, dashArray: "8 6" }}
              />
            )}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
