import React from 'react';
import { GameState, SessionStats, BreathStats } from '../../types';
import { Mic, Pause, RotateCcw, Wind, Gauge, AlertCircle } from 'lucide-react';

interface OverlayProps {
  gameState: GameState;
  breathStats: BreathStats;
  sessionStats: SessionStats;
  aiFeedback: string;
  onStart: () => void;
  onEnd: () => void;
  onReset: () => void;
  calibrationProgress?: number;
}

const Overlay: React.FC<OverlayProps> = ({
  gameState,
  breathStats,
  sessionStats,
  aiFeedback,
  onStart,
  onEnd,
  onReset,
  calibrationProgress = 0
}) => {
  // START SCREEN
  if (gameState === GameState.IDLE) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-10 p-4 text-center">
        <h1 className="text-5xl font-bold text-orange-500 mb-4 tracking-wider uppercase" style={{ textShadow: '0 0 20px #ff6600' }}>
          COPD Dragon
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-md leading-relaxed">
          Respiratory Rehab Training
          <br />
          <span className="text-sm text-gray-500 mt-2 block">
            We will calibrate your environment first. Please be in a quiet room.
          </span>
        </p>
        <button
          onClick={onStart}
          className="flex items-center gap-3 px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-xl font-bold transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(234,88,12,0.5)]"
        >
          <Mic size={24} />
          Start Calibration
        </button>
      </div>
    );
  }

  // CALIBRATION SCREEN
  if (gameState === GameState.CALIBRATING) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white z-10">
        <Gauge className="text-orange-500 w-16 h-16 mb-6 animate-pulse" />
        <h2 className="text-2xl font-bold mb-2">Calibrating Sensor</h2>
        <p className="text-gray-400 mb-8">Please stay silent...</p>
        
        <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-orange-500 transition-all duration-100 ease-linear"
            style={{ width: `${calibrationProgress}%` }}
          />
        </div>
        <p className="mt-4 text-sm text-gray-500">{calibrationProgress}%</p>
      </div>
    );
  }

  // SUMMARY SCREEN
  if (gameState === GameState.SUMMARY) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white z-10 p-6">
        <div className="bg-gray-900 border border-orange-900/50 p-8 rounded-2xl max-w-lg w-full shadow-2xl">
          <h2 className="text-3xl font-bold text-orange-500 mb-6 text-center">Session Complete</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-800 p-4 rounded-lg text-center">
              <p className="text-gray-400 text-sm uppercase">Total Breaths</p>
              <p className="text-3xl font-bold text-white">{sessionStats.totalBreaths}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg text-center">
              <p className="text-gray-400 text-sm uppercase">Max Duration</p>
              <p className="text-3xl font-bold text-white">{sessionStats.maxDuration.toFixed(1)}s</p>
            </div>
          </div>

          <div className="mb-8 bg-black/40 p-6 rounded-lg border-l-4 border-orange-500">
            <h3 className="text-orange-400 font-semibold mb-2 flex items-center gap-2">
              <Wind size={18} />
              The Dragon Keeper says:
            </h3>
            <p className="text-gray-300 italic leading-relaxed">
              "{aiFeedback || 'Consulting the ancient scrolls...'}"
            </p>
          </div>

          <div className="flex justify-center gap-4">
             <button
              onClick={onReset}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
            >
              <RotateCcw size={20} />
              Train Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE GAME OVERLAY
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-white/50 tracking-widest uppercase">Pursed-Lip Exercise</h2>
          <div className="flex items-center gap-2">
             <div className={`w-3 h-3 rounded-full ${breathStats.isBreathing ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
             <span className={`text-xs uppercase tracking-wider ${breathStats.isBreathing ? 'text-green-400' : 'text-gray-500'}`}>
               {breathStats.isBreathing ? 'Exhalation Detected' : 'Inhale (Nose)...'}
             </span>
          </div>
        </div>
        
        <button
          onClick={onEnd}
          className="pointer-events-auto p-3 bg-red-900/80 hover:bg-red-800 text-white rounded-full transition-colors backdrop-blur-sm"
          title="End Session"
        >
          <Pause size={24} />
        </button>
      </div>

      {/* SPIROMETRY GAUGE (Left Side) */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-4">
        <div className="h-64 w-8 bg-gray-800/80 rounded-full border border-gray-700 relative overflow-hidden flex flex-col justify-end">
            {/* Target Zone Background */}
            <div className="absolute bottom-[30%] h-[40%] w-full bg-green-900/30 border-y border-green-500/30 z-0"></div>
            
            {/* Fill Level */}
            <div 
                className={`w-full transition-all duration-200 z-10 ${breathStats.intensity > 0.8 ? 'bg-red-500' : breathStats.intensity > 0.3 ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ height: `${breathStats.intensity * 100}%` }}
            />
            
            {/* Markers */}
            <div className="absolute inset-0 z-20 flex flex-col justify-between py-2 pointer-events-none">
                <div className="w-full h-px bg-white/10"></div>
                <div className="w-full h-px bg-white/10"></div>
                <div className="w-full h-px bg-white/10"></div>
                <div className="w-full h-px bg-white/10"></div>
            </div>
        </div>
        <div className="flex flex-col justify-between h-64 text-xs text-gray-500 font-mono py-1">
            <span>MAX</span>
            <span className="text-green-500 font-bold">TARGET</span>
            <span>MIN</span>
        </div>
      </div>

      {/* Center Feedback */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full pointer-events-none">
        
        {/* Technique Correction */}
        {breathStats.intensity > 0.2 && !breathStats.isBreathing && (
           <div className="animate-pulse flex flex-col items-center">
             <AlertCircle className="text-yellow-500 mb-2 h-12 w-12" />
             <h2 className="text-2xl font-bold text-yellow-500 tracking-wider">PURSE LIPS</h2>
             <p className="text-sm text-gray-400 mt-1">Make a "hissing" sound</p>
           </div>
        )}

        {/* Positive Reinforcement */}
        {breathStats.isBreathing && breathStats.duration > 4.0 && (
           <div className="animate-bounce">
             <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-red-600 drop-shadow-[0_0_15px_rgba(255,100,0,0.8)]">
               EXCELLENT
             </h1>
             <p className="text-orange-200 font-bold tracking-[0.5em] mt-2">STEADY FLOW</p>
           </div>
        )}
      </div>

      {/* Bottom Stats */}
      <div className="flex justify-center items-end pb-8">
        <div className="text-center">
            <p className="text-5xl font-mono font-bold text-white drop-shadow-md">
                {breathStats.duration.toFixed(1)}<span className="text-xl text-gray-500 ml-1">sec</span>
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-2">Exhalation Time</p>
        </div>
      </div>
    </div>
  );
};

export default Overlay;