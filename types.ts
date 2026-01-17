export interface BreathStats {
  duration: number;
  intensity: number; // 0.0 to 1.0
  isBreathing: boolean;
}

export interface SessionStats {
  totalBreaths: number;
  maxDuration: number;
  totalDuration: number;
  avgIntensity: number;
}

export enum GameState {
  IDLE = 'IDLE',
  CALIBRATING = 'CALIBRATING',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  SUMMARY = 'SUMMARY'
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  type: 'smoke' | 'fire';
}