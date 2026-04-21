import { useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Box, Plane, Line, Text } from "@react-three/drei";
import { useTrafficState } from "@/hooks/useTrafficState";
import { LANES, type Lane } from "@/backend/schemas";
import { cn } from "@/lib/utils";
import * as THREE from "three";

const POS: Record<Lane, [number, number, number]> = {
  north: [0, 0, -4],
  south: [0, 0, 4],
  east: [4, 0, 0],
  west: [-4, 0, 0],
};

const TrafficLight3D = ({ position, rotation, state }: { position: [number, number, number], rotation: [number, number, number], state: string }) => {
  const isRed = state === "red";
  const isYellow = state === "yellow";
  const isGreen = state === "green";

  return (
    <group position={position} rotation={rotation}>
      <Box args={[0.4, 1.2, 0.4]} position={[0, 0.6, 0]}>
        <meshStandardMaterial color="#222" />
      </Box>
      <Box args={[0.2, 0.2, 0.1]} position={[0, 0.9, 0.22]}>
        <meshStandardMaterial color={isRed ? "#ff4060" : "#441111"} emissive={isRed ? "#ff4060" : "#000"} emissiveIntensity={isRed ? 2 : 0} />
      </Box>
      <Box args={[0.2, 0.2, 0.1]} position={[0, 0.6, 0.22]}>
        <meshStandardMaterial color={isYellow ? "#ffcc00" : "#443300"} emissive={isYellow ? "#ffcc00" : "#000"} emissiveIntensity={isYellow ? 2 : 0} />
      </Box>
      <Box args={[0.2, 0.2, 0.1]} position={[0, 0.3, 0.22]}>
        <meshStandardMaterial color={isGreen ? "#00ff88" : "#003311"} emissive={isGreen ? "#00ff88" : "#000"} emissiveIntensity={isGreen ? 2 : 0} />
      </Box>
    </group>
  );
};

const LaneCars = ({ lane, density, isEmergency }: { lane: Lane, density: number, isEmergency: boolean }) => {
  const ref = useRef<THREE.Group>(null);
  const numCars = Math.floor(density * 10);
  
  useFrame((state) => {
    if (ref.current) {
      // Gentle floating animation to signify dynamic data
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 2 + (lane === 'north' ? 0 : 1)) * 0.05;
    }
  });

  return (
    <group ref={ref} position={POS[lane]}>
      {Array.from({ length: numCars }).map((_, i) => {
        const offset = i * 0.8 + 0.5;
        let pos: [number, number, number] = [0, 0.2, 0];
        if (lane === "north") pos = [-0.5, 0.2, -offset];
        if (lane === "south") pos = [0.5, 0.2, offset];
        if (lane === "east") pos = [offset, 0.2, -0.5];
        if (lane === "west") pos = [-offset, 0.2, 0.5];

        return (
          <Box key={i} args={[0.6, 0.4, 1.2]} position={pos} rotation={[0, lane === "east" || lane === "west" ? Math.PI / 2 : 0, 0]}>
            <meshStandardMaterial 
              color={isEmergency ? "#ff4060" : "#00e5ff"} 
              emissive={isEmergency ? "#ff0000" : "#0088ff"}
              emissiveIntensity={isEmergency ? 1 : 0.2}
              transparent
              opacity={0.8}
            />
          </Box>
        );
      })}
      <Text position={[0, 1.5, 0]} fontSize={0.4} color="#ffffff" anchorX="center" anchorY="middle">
        {Math.round(density * 100)}%
      </Text>
    </group>
  );
};

export function MapView() {
  const detections = useTrafficState((s) => s.detections);
  const signals = useTrafficState((s) => s.signals);
  const emergency = useTrafficState((s) => s.emergency);
  const scenario = useTrafficState((s) => s.scenario);

  return (
    <div className="bg-panel/40 backdrop-blur border border-panel-border rounded-lg p-4 h-full flex flex-col relative overflow-hidden transition-all duration-300">
      {scenario === "emergency" && (
        <div className="absolute inset-0 z-0 animate-emergency-pulse rounded-lg pointer-events-none" />
      )}
      
      <div className="flex items-center justify-between mb-3 z-10">
        <h2 className="text-sm font-mono uppercase tracking-wider text-primary drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]">Live 3D Map · Bengaluru</h2>
        <div className="flex gap-1">
          <span className="px-2 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
            3D ENGINE ACTIVE
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-[350px] rounded-md overflow-hidden bg-background/50 border border-panel-border relative z-10 w-full glass">
        <Canvas camera={{ position: [8, 8, 8], fov: 45 }}>
          <color attach="background" args={["#0a0f12"]} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <Environment preset="night" />
          
          <OrbitControls 
            enablePan={false} 
            maxPolarAngle={Math.PI / 2 - 0.1} 
            minDistance={5} 
            maxDistance={15} 
          />

          {/* Central grid/roads */}
          <group position={[0, -0.01, 0]}>
            <Plane args={[20, 20]} rotation={[-Math.PI / 2, 0, 0]}>
              <meshStandardMaterial color="#05080a" />
            </Plane>
            <Plane args={[4, 20]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
              <meshStandardMaterial color="#1a2025" />
            </Plane>
            <Plane args={[20, 4]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
              <meshStandardMaterial color="#1a2025" />
            </Plane>
            {/* Center block */}
            <Plane args={[4, 4]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <meshStandardMaterial color="#212a30" />
            </Plane>
            
            {/* Dashed lines */}
            <Line points={[[-10, 0.03, 0], [-2, 0.03, 0]]} color="#666" dashed dashScale={10} dashSize={1} gapSize={1} />
            <Line points={[[2, 0.03, 0], [10, 0.03, 0]]} color="#666" dashed dashScale={10} dashSize={1} gapSize={1} />
            <Line points={[[0, 0.03, -10], [0, 0.03, -2]]} color="#666" dashed dashScale={10} dashSize={1} gapSize={1} />
            <Line points={[[0, 0.03, 2], [0, 0.03, 10]]} color="#666" dashed dashScale={10} dashSize={1} gapSize={1} />
            
            {/* Direction Markers */}
            <Text position={[0, 0.1, -9]} rotation={[-Math.PI / 2, 0, 0]} fontSize={1.5} color="#00e5ff" anchorX="center" anchorY="middle" opacity={0.5}>N</Text>
            <Text position={[0, 0.1, 9]} rotation={[-Math.PI / 2, 0, 0]} fontSize={1.5} color="#00e5ff" anchorX="center" anchorY="middle" opacity={0.5}>S</Text>
            <Text position={[9, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={1.5} color="#00e5ff" anchorX="center" anchorY="middle" opacity={0.5}>E</Text>
            <Text position={[-9, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={1.5} color="#00e5ff" anchorX="center" anchorY="middle" opacity={0.5}>W</Text>
          </group>

          {/* Traffic Lights */}
          <TrafficLight3D position={[-2.5, 0, 2.5]} rotation={[0, Math.PI, 0]} state={signals.north} />
          <TrafficLight3D position={[2.5, 0, -2.5]} rotation={[0, 0, 0]} state={signals.south} />
          <TrafficLight3D position={[-2.5, 0, -2.5]} rotation={[0, Math.PI / 2, 0]} state={signals.east} />
          <TrafficLight3D position={[2.5, 0, 2.5]} rotation={[0, -Math.PI / 2, 0]} state={signals.west} />

          {/* Lanes and Cars */}
          {LANES.map(l => (
            <LaneCars 
              key={l} 
              lane={l} 
              density={detections[l]?.density_score ?? 0}
              isEmergency={emergency?.corridor?.[0] === l || emergency?.corridor?.[1] === l}
            />
          ))}

          {/* Emergency overlay plane */}
          {emergency && (
            <Plane args={[4.2, 20]} rotation={[-Math.PI / 2, 0, emergency.corridor[0] === 'east' || emergency.corridor[0] === 'west' ? Math.PI / 2 : 0]} position={[0, 0.05, 0]}>
              <meshBasicMaterial color="#ff0000" transparent opacity={0.2} toneMapped={false} />
            </Plane>
          )}
        </Canvas>
      </div>
    </div>
  );
}

