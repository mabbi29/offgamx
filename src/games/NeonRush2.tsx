import React, { useRef, useEffect, useState } from 'react';
import { ActiveGameContext } from '../types';
import { sound } from '../utils/audio';

export const NeonRush2: React.FC<ActiveGameContext> = ({
  level,
  isPaused,
  isSoundOn,
  onNextLevel,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [targetDistance, setTargetDistance] = useState(1000 + level * 500);
  const [nitro, setNitro] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  // Touch controls state
  const touchSteerRef = useRef<'left' | 'right' | null>(null);
  const touchNitroRef = useRef<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let playerX = 0; // -1 to 1 across road
    let currentSpeed = 0;
    const maxSpeed = 120 + level * 10;
    let distTravelled = 0;
    const targetDist = 1000 + level * 500;
    setTargetDistance(targetDist);
    let nitroFuel = 100;
    let currentScore = 0;

    // Traffic cars
    interface TrafficCar {
      x: number; // -0.8 to 0.8
      z: number; // distance ahead in virtual units (0 to 1200)
      speed: number;
      color: string;
      width: number;
    }

    const traffic: TrafficCar[] = [];
    const colors = ['#f43f5e', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#a855f7'];

    for (let i = 0; i < 6 + Math.min(level, 10); i++) {
      traffic.push({
        x: (Math.random() - 0.5) * 1.5,
        z: 200 + i * 180 + Math.random() * 80,
        speed: 30 + Math.random() * 40,
        color: colors[i % colors.length],
        width: 0.28,
      });
    }

    // Road segments & scenery
    let roadCurve = 0;
    let targetCurve = 0;
    let curveTimer = 0;

    // Key states
    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      keys[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Resize observer
    const updateSize = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.scale(dpr, dpr);
    };

    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    updateSize();

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (!isPaused && !gameOver && !gameWon) {
        // Curve change
        curveTimer += dt;
        if (curveTimer > 4) {
          curveTimer = 0;
          targetCurve = (Math.random() - 0.5) * 1.8;
        }
        roadCurve += (targetCurve - roadCurve) * dt * 0.8;

        // Player steering
        const isLeft = keys['ArrowLeft'] || keys['KeyA'] || touchSteerRef.current === 'left';
        const isRight = keys['ArrowRight'] || keys['KeyD'] || touchSteerRef.current === 'right';
        const isGas = keys['ArrowUp'] || keys['KeyW'] || true; // Auto-accelerate for arcade feel
        const isBrake = keys['ArrowDown'] || keys['KeyS'];
        const isNitroKey = keys['Space'] || touchNitroRef.current;

        // Steering speed scales with forward velocity
        const steerSpeed = (1.4 + (currentSpeed / maxSpeed) * 0.8) * dt;
        if (isLeft) playerX -= steerSpeed;
        if (isRight) playerX += steerSpeed;
        playerX = Math.max(-0.95, Math.min(0.95, playerX));

        // Speed calculation
        let accel = 40;
        let topSpd = maxSpeed;

        if (isNitroKey && nitroFuel > 0) {
          topSpd = maxSpeed * 1.45;
          accel = 85;
          nitroFuel = Math.max(0, nitroFuel - dt * 25);
          if (Math.random() < 0.2) sound.playLaser();
        } else {
          nitroFuel = Math.min(100, nitroFuel + dt * 6);
        }

        if (isBrake) {
          currentSpeed = Math.max(20, currentSpeed - dt * 90);
        } else if (isGas) {
          currentSpeed = Math.min(topSpd, currentSpeed + dt * accel);
        }

        distTravelled += (currentSpeed * dt * 2.5);
        currentScore += Math.floor(currentSpeed * dt * 5);

        setSpeed(Math.floor(currentSpeed));
        setDistance(Math.floor(distTravelled));
        setNitro(Math.floor(nitroFuel));
        setScore(currentScore);

        // Win condition
        if (distTravelled >= targetDist) {
          setGameWon(true);
          sound.playWin();
          return;
        }

        // Move traffic
        for (const car of traffic) {
          // relative speed
          const relSpeed = currentSpeed - car.speed;
          car.z -= relSpeed * dt * 3;

          // Wrap around ahead or behind
          if (car.z < -40) {
            car.z = 800 + Math.random() * 400;
            car.x = (Math.random() - 0.5) * 1.5;
            car.speed = 30 + Math.random() * 45;
          } else if (car.z > 1400) {
            car.z = -20;
          }

          // Collision check: when car is very close (z between 0 and 50) and x overlaps
          if (car.z > 0 && car.z < 45) {
            if (Math.abs(playerX - car.x) < 0.25) {
              sound.playExplosion();
              sound.playHit();
              setGameOver(true);
              return;
            }
          }
        }
      }

      // RENDER
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      const horizonY = h * 0.44;

      // 1. Sky & Sunset Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.5, '#3b0764');
      skyGrad.addColorStop(0.85, '#ec4899');
      skyGrad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, horizonY);

      // Glowing Synthwave Sun
      const sunY = horizonY - 20;
      const sunRad = Math.min(w * 0.12, 70);
      const sunGrad = ctx.createLinearGradient(0, sunY - sunRad, 0, sunY + sunRad);
      sunGrad.addColorStop(0, '#fef08a');
      sunGrad.addColorStop(0.5, '#f43f5e');
      sunGrad.addColorStop(1, '#7e22ce');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(w * 0.5 + roadCurve * 40, sunY, sunRad, 0, Math.PI * 2);
      ctx.fill();

      // Sun stripes
      ctx.fillStyle = '#3b0764';
      for (let s = 1; s <= 6; s++) {
        const stripeY = sunY + (s * 8);
        if (stripeY < sunY + sunRad) {
          ctx.fillRect(w * 0.5 + roadCurve * 40 - sunRad, stripeY, sunRad * 2, 2.5);
        }
      }

      // Distant City Skyline Silhouettes
      ctx.fillStyle = '#1e1b4b';
      const cityBuildings = 18;
      const bw = w / cityBuildings;
      for (let i = 0; i < cityBuildings; i++) {
        const bh = (Math.sin(i * 1.7) * 0.5 + 0.5) * 35 + 15;
        ctx.fillRect(i * bw, horizonY - bh, bw + 1, bh);
      }

      // 2. Ground Terrain
      const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
      groundGrad.addColorStop(0, '#090d16');
      groundGrad.addColorStop(1, '#020617');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, horizonY, w, h - horizonY);

      // 3. Perspective 3D Road
      const roadBottomW = w * 0.85;
      const roadTopW = w * 0.08;
      const roadCenterBottom = w * 0.5;
      const roadCenterTop = w * 0.5 + roadCurve * 90;

      // Draw road polygon
      ctx.beginPath();
      ctx.moveTo(roadCenterTop - roadTopW * 0.5, horizonY);
      ctx.lineTo(roadCenterTop + roadTopW * 0.5, horizonY);
      ctx.lineTo(roadCenterBottom + roadBottomW * 0.5, h);
      ctx.lineTo(roadCenterBottom - roadBottomW * 0.5, h);
      ctx.closePath();
      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, h);
      roadGrad.addColorStop(0, '#1e293b');
      roadGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = roadGrad;
      ctx.fill();

      // Road Borders (Glowing Neon Curbs)
      const rumbleLines = 24;
      const offset = (distTravelled * 0.1) % 1;

      for (let i = 0; i < rumbleLines; i++) {
        const p1 = (i + offset) / rumbleLines;
        const p2 = (i + offset + 0.5) / rumbleLines;
        if (p1 > 1) continue;

        const y1 = horizonY + Math.pow(p1, 2.5) * (h - horizonY);
        const y2 = horizonY + Math.pow(Math.min(1, p2), 2.5) * (h - horizonY);

        const rw1 = roadTopW + (roadBottomW - roadTopW) * Math.pow(p1, 2.5);
        const rw2 = roadTopW + (roadBottomW - roadTopW) * Math.pow(Math.min(1, p2), 2.5);
        const rc1 = roadCenterTop + (roadCenterBottom - roadCenterTop) * p1;
        const rc2 = roadCenterTop + (roadCenterBottom - roadCenterTop) * Math.min(1, p2);

        // Neon curb left & right
        const curbColor = i % 2 === 0 ? '#06b6d4' : '#ec4899';
        ctx.fillStyle = curbColor;

        // Left curb
        ctx.beginPath();
        ctx.moveTo(rc1 - rw1 * 0.5 - 6, y1);
        ctx.lineTo(rc1 - rw1 * 0.5, y1);
        ctx.lineTo(rc2 - rw2 * 0.5, y2);
        ctx.lineTo(rc2 - rw2 * 0.5 - 12, y2);
        ctx.fill();

        // Right curb
        ctx.beginPath();
        ctx.moveTo(rc1 + rw1 * 0.5, y1);
        ctx.lineTo(rc1 + rw1 * 0.5 + 6, y1);
        ctx.lineTo(rc2 + rw2 * 0.5 + 12, y2);
        ctx.lineTo(rc2 + rw2 * 0.5, y2);
        ctx.fill();

        // Center dashed neon divider
        if (i % 2 === 0) {
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(rc1 - 2, y1, 4, Math.max(2, y2 - y1));
        }
      }

      // 4. Render Traffic Cars (Sorted back to front)
      const sortedTraffic = [...traffic].filter((c) => c.z > 0 && c.z < 1200);
      sortedTraffic.sort((a, b) => b.z - a.z);

      for (const car of sortedTraffic) {
        const normZ = 1 - car.z / 1200; // 0 (horizon) to 1 (near)
        if (normZ <= 0) continue;

        const p = Math.pow(normZ, 2.2);
        const carY = horizonY + p * (h - horizonY);
        const rw = roadTopW + (roadBottomW - roadTopW) * p;
        const rc = roadCenterTop + (roadCenterBottom - roadCenterTop) * normZ;
        const carX = rc + (car.x * rw * 0.45);

        const carW = Math.max(14, w * 0.08 * p);
        const carH = carW * 0.55;

        // Car Body Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(carX - carW * 0.5, carY + carH * 0.4, carW, carH * 0.4);

        // Car body
        ctx.fillStyle = car.color;
        ctx.beginPath();
        ctx.roundRect(carX - carW * 0.5, carY - carH * 0.5, carW, carH, 3);
        ctx.fill();

        // Cabin roof
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(carX - carW * 0.35, carY - carH * 0.45, carW * 0.7, carH * 0.45);

        // Taillights
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 6;
        ctx.fillRect(carX - carW * 0.42, carY + carH * 0.1, carW * 0.22, carH * 0.25);
        ctx.fillRect(carX + carW * 0.2, carY + carH * 0.1, carW * 0.22, carH * 0.25);
        ctx.shadowBlur = 0;
      }

      // 5. Render Player Supercar (Foreground)
      const playerY = h * 0.84;
      const playerCarW = Math.max(55, w * 0.11);
      const playerCarH = playerCarW * 0.52;
      const playerScreenX = roadCenterBottom + (playerX * roadBottomW * 0.44);

      // Exhaust particle glow
      if (currentSpeed > 20) {
        ctx.fillStyle = nitroFuel > 0 && (keys['Space'] || touchNitroRef.current) ? '#06b6d4' : '#f97316';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(playerScreenX - playerCarW * 0.28, playerY + playerCarH * 0.45, 5 + Math.random() * 4, 0, Math.PI * 2);
        ctx.arc(playerScreenX + playerCarW * 0.28, playerY + playerCarH * 0.45, 5 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Car Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.ellipse(playerScreenX, playerY + playerCarH * 0.45, playerCarW * 0.55, playerCarH * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Player Car Chasis (Vibrant Cyan Supercar)
      const carGrad = ctx.createLinearGradient(playerScreenX - playerCarW * 0.5, 0, playerScreenX + playerCarW * 0.5, 0);
      carGrad.addColorStop(0, '#0284c7');
      carGrad.addColorStop(0.5, '#38bdf8');
      carGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = carGrad;
      ctx.beginPath();
      ctx.roundRect(playerScreenX - playerCarW * 0.5, playerY - playerCarH * 0.4, playerCarW, playerCarH, 8);
      ctx.fill();

      // Aerodynamic Cockpit Glass
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(playerScreenX - playerCarW * 0.35, playerY - playerCarH * 0.35, playerCarW * 0.7, playerCarH * 0.4, 4);
      ctx.fill();

      // Rear Neon Spoiler & Lightbar
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.fillRect(playerScreenX - playerCarW * 0.45, playerY + playerCarH * 0.15, playerCarW * 0.9, 4);
      ctx.shadowBlur = 0;

      // HUD & Overlays
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px var(--font-heading), sans-serif';

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      ro.disconnect();
    };
  }, [level, isPaused, gameOver, gameWon]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[460px] bg-slate-950 select-none overflow-hidden flex flex-col">
      <canvas ref={canvasRef} className="w-full h-full flex-1 block" />

      {/* In-Game HUD overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none text-white font-mono text-xs">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <span className="text-cyan-400 font-bold">LEVEL {level} / 25</span>
          <span className="text-slate-600">|</span>
          <span>DIST: {distance}m / {targetDistance}m</span>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">SPD:</span>
            <span className="text-amber-400 font-bold text-sm tabular-nums">{speed}</span>
            <span className="text-[10px] text-slate-500">KM/H</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">NITRO:</span>
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                style={{ width: `${nitro}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* On-screen touch controls for mobile */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto sm:hidden">
        <div className="flex gap-2">
          <button
            onTouchStart={() => (touchSteerRef.current = 'left')}
            onTouchEnd={() => (touchSteerRef.current = null)}
            className="w-14 h-14 rounded-2xl bg-slate-800/80 active:bg-cyan-500 text-white font-bold text-lg flex items-center justify-center border border-slate-700"
          >
            ←
          </button>
          <button
            onTouchStart={() => (touchSteerRef.current = 'right')}
            onTouchEnd={() => (touchSteerRef.current = null)}
            className="w-14 h-14 rounded-2xl bg-slate-800/80 active:bg-cyan-500 text-white font-bold text-lg flex items-center justify-center border border-slate-700"
          >
            →
          </button>
        </div>

        <button
          onTouchStart={() => (touchNitroRef.current = true)}
          onTouchEnd={() => (touchNitroRef.current = false)}
          className="w-20 h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center border border-cyan-400 shadow-lg shadow-cyan-500/20"
        >
          NITRO
        </button>
      </div>

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-rose-500 tracking-tight">CRASHED!</h2>
          <p className="text-slate-300 text-sm mt-2 max-w-xs">
            Watch out for highway traffic at high speeds.
          </p>
          <div className="my-4 text-xs font-mono text-slate-400">
            DISTANCE REACHED: {distance}m
          </div>
          <button
            onClick={() => {
              setGameOver(false);
              onRestart();
            }}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Level Win Modal */}
      {gameWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
          <h2 className="text-3xl font-black text-cyan-400 tracking-tight">LEVEL COMPLETE!</h2>
          <p className="text-slate-300 text-sm mt-2">
            Target distance conquered. Highway clear!
          </p>
          <div className="my-4 text-xs font-mono text-emerald-400">
            SCORE: {score}
          </div>
          <button
            onClick={() => {
              setGameWon(false);
              onNextLevel();
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all"
          >
            Next Level (Level {Math.min(25, level + 1)})
          </button>
        </div>
      )}
    </div>
  );
};
