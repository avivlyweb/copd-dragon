import React, { useState, useEffect, useRef, useCallback } from 'react';
import DragonScene from './components/DragonScene';
import Overlay from './components/ui/Overlay';
import { AudioAnalyzer } from './services/audioAnalyzer';
import { generateDragonKeeperFeedback } from './services/geminiService';
import { GameState, BreathStats, SessionStats } from './types';
import { AUDIO_THRESHOLDS } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [breathStats, setBreathStats] = useState<BreathStats>({
    duration: 0,
    intensity: 0,
    isBreathing: false
  });
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalBreaths: 0,
    maxDuration: 0,
    totalDuration: 0,
    avgIntensity: 0
  });
  const [aiFeedback, setAiFeedback] = useState<string>('');
  
  // Calibration State
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [noiseFloor, setNoiseFloor] = useState(0.05);

  const audioAnalyzerRef = useRef<AudioAnalyzer>(new AudioAnalyzer());
  const rafRef = useRef<number>();
  const breathStartTimeRef = useRef<number>(0);

  // Core Game Loop
  const updateLoop = useCallback(() => {
    const analyzer = audioAnalyzerRef.current;
    if (!analyzer.isReady) return;

    const volume = analyzer.getVolume();

    // CALIBRATION LOGIC
    if (gameState === GameState.CALIBRATING) {
      // Just visually show volume during calibration so user knows mic works
      // The actual calculation happens in the useEffect timer below
      setBreathStats(prev => ({ ...prev, intensity: volume })); 
      rafRef.current = requestAnimationFrame(updateLoop);
      return;
    }

    if (gameState !== GameState.ACTIVE) return;

    // GAMEPLAY LOGIC
    // Dynamic Threshold: Must be significantly higher than the calibrated noise floor
    const triggerThreshold = noiseFloor * 1.5 + 0.05; // Safety margin
    const stopThreshold = noiseFloor * 1.2; 

    // Hysteresis
    const isBreathingNow = breathStats.isBreathing 
      ? volume > stopThreshold 
      : volume > triggerThreshold;

    if (isBreathingNow) {
       if (!breathStats.isBreathing) {
         breathStartTimeRef.current = Date.now();
       }
       
       const duration = (Date.now() - breathStartTimeRef.current) / 1000;
       
       // Map volume to intensity (clamped 0-1), scaling based on expected max
       // Intensity is purely for visuals (how big the fire is)
       const visualIntensity = Math.min((volume - noiseFloor) * 2.5, 1.0);

       setBreathStats({
         isBreathing: true,
         intensity: Math.max(0, visualIntensity),
         duration: duration
       });
       
    } else {
      if (breathStats.isBreathing) {
         const finalDuration = breathStats.duration;
         // Filter out tiny blips (< 0.5s)
         if (finalDuration > 0.5) {
             setSessionStats(prev => ({
                 totalBreaths: prev.totalBreaths + 1,
                 maxDuration: Math.max(prev.maxDuration, finalDuration),
                 totalDuration: prev.totalDuration + finalDuration,
                 avgIntensity: (prev.avgIntensity * prev.totalBreaths + breathStats.intensity) / (prev.totalBreaths + 1)
             }));
         }
      }

      setBreathStats({
        isBreathing: false,
        intensity: 0,
        duration: 0
      });
    }

    rafRef.current = requestAnimationFrame(updateLoop);
  }, [gameState, breathStats.isBreathing, noiseFloor, breathStats.intensity, breathStats.duration]);

  useEffect(() => {
    if (gameState === GameState.ACTIVE || gameState === GameState.CALIBRATING) {
      rafRef.current = requestAnimationFrame(updateLoop);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [gameState, updateLoop]);

  // Calibration Sequence
  useEffect(() => {
    if (gameState === GameState.CALIBRATING) {
      let progress = 0;
      let noiseSamples: number[] = [];
      const interval = setInterval(() => {
        progress += 5;
        setCalibrationProgress(progress);
        
        // Sample noise
        if (audioAnalyzerRef.current.isReady) {
          noiseSamples.push(audioAnalyzerRef.current.getVolume());
        }

        if (progress >= 100) {
          clearInterval(interval);
          // Calculate average noise floor
          const avgNoise = noiseSamples.reduce((a, b) => a + b, 0) / (noiseSamples.length || 1);
          console.log("Calibration Complete. Noise Floor:", avgNoise);
          setNoiseFloor(Math.max(avgNoise, 0.02)); // Ensure non-zero floor
          setGameState(GameState.ACTIVE);
        }
      }, 100); // 2 seconds total (20 steps * 100ms)

      return () => clearInterval(interval);
    }
  }, [gameState]);

  const handleStart = async () => {
    try {
      await audioAnalyzerRef.current.initialize();
      setGameState(GameState.CALIBRATING);
      setCalibrationProgress(0);
    } catch (e) {
      alert("Microphone access is required.");
    }
  };

  const handleEnd = async () => {
    setGameState(GameState.SUMMARY);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    audioAnalyzerRef.current.cleanup();
    
    setAiFeedback("Consulting the Dragon Keeper...");
    const feedback = await generateDragonKeeperFeedback(sessionStats);
    setAiFeedback(feedback);
  };

  const handleReset = () => {
      setGameState(GameState.IDLE);
      setAiFeedback('');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-900 select-none">
      <DragonScene breathStats={breathStats} />
      <Overlay 
        gameState={gameState}
        breathStats={breathStats}
        sessionStats={sessionStats}
        aiFeedback={aiFeedback}
        onStart={handleStart}
        onEnd={handleEnd}
        onReset={handleReset}
        calibrationProgress={calibrationProgress}
      />
    </div>
  );
};

export default App;