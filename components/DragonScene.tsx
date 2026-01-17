import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { BreathStats } from '../types';
import { DRAGON_COLORS, FIRE_COLORS, GAME_SETTINGS } from '../constants';

interface DragonSceneProps {
  breathStats: BreathStats;
}

const DragonScene: React.FC<DragonSceneProps> = ({ breathStats }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const dragonGroupRef = useRef<THREE.Group | null>(null);
  const mouthPositionRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const particlesRef = useRef<any[]>([]); // Using simple object array for manual particle system
  const particleGeometryRef = useRef<THREE.BufferGeometry | null>(null);
  const particleMaterialRef = useRef<THREE.PointsMaterial | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  
  // Ref to track breath duration internally for visual flair timing
  const continuousBreathTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- Setup ---
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    scene.fog = new THREE.FogExp2(0x111111, 0.02);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 1, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const fireLight = new THREE.PointLight(0xffaa00, 0, 10);
    fireLight.position.set(0, 0, 2);
    scene.add(fireLight);

    // --- Dragon Construction (Refined Low Poly) ---
    const dragonGroup = new THREE.Group();
    
    // Materials
    const skinMaterial = new THREE.MeshStandardMaterial({ 
      color: DRAGON_COLORS.SKIN, 
      roughness: 0.5,
      metalness: 0.1,
      flatShading: true 
    });
    
    const skinDarkMaterial = new THREE.MeshStandardMaterial({ 
      color: DRAGON_COLORS.SKIN_DARK, 
      roughness: 0.7,
      flatShading: true 
    });

    const hornMaterial = new THREE.MeshStandardMaterial({ 
      color: DRAGON_COLORS.HORN, 
      roughness: 0.3,
      flatShading: true 
    });
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: DRAGON_COLORS.EYE });

    // Head (Icosahedron for a more organic, distinct low-poly shape)
    const headGeo = new THREE.IcosahedronGeometry(1.4, 0);
    const head = new THREE.Mesh(headGeo, skinMaterial);
    head.scale.set(1, 1.15, 1.3); // Slightly elongated
    dragonGroup.add(head);

    // Snout (Tapered Cylinder, rotated)
    // CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
    const snoutGeo = new THREE.CylinderGeometry(0.5, 0.95, 1.6, 6);
    snoutGeo.rotateX(-Math.PI / 2); // Point along Z
    snoutGeo.rotateZ(Math.PI / 6); // Align flat side up
    const snout = new THREE.Mesh(snoutGeo, skinMaterial);
    snout.position.set(0, -0.2, 1.4);
    dragonGroup.add(snout);

    // Nostrils (Small cones on snout tip)
    const nostrilGeo = new THREE.ConeGeometry(0.12, 0.3, 4);
    const leftNostril = new THREE.Mesh(nostrilGeo, skinDarkMaterial);
    leftNostril.position.set(0.25, 0.35, 2.0);
    leftNostril.rotation.x = -Math.PI / 4;
    dragonGroup.add(leftNostril);
    
    const rightNostril = new THREE.Mesh(nostrilGeo, skinDarkMaterial);
    rightNostril.position.set(-0.25, 0.35, 2.0);
    rightNostril.rotation.x = -Math.PI / 4;
    dragonGroup.add(rightNostril);

    // Jaw (Lower, slightly smaller and darker for contrast)
    const jawGeo = new THREE.CylinderGeometry(0.4, 0.8, 1.4, 6);
    jawGeo.rotateX(-Math.PI / 2);
    jawGeo.rotateZ(Math.PI / 6);
    const jaw = new THREE.Mesh(jawGeo, skinDarkMaterial);
    jaw.position.set(0, -0.8, 1.3);
    jaw.rotation.x = 0.25; // Open slightly
    dragonGroup.add(jaw);

    // Eyes (Capsules for an elongated, fierce look)
    const eyeGeo = new THREE.CapsuleGeometry(0.12, 0.3, 4, 8);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    leftEye.position.set(0.65, 0.5, 0.9);
    leftEye.rotation.z = -0.5; // Slant inward
    leftEye.rotation.y = 0.4;  // Face forward
    leftEye.rotation.x = -0.2;
    dragonGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    rightEye.position.set(-0.65, 0.5, 0.9);
    rightEye.rotation.z = 0.5;
    rightEye.rotation.y = -0.4;
    rightEye.rotation.x = -0.2;
    dragonGroup.add(rightEye);
    
    // Brows (Ridges above eyes)
    const browGeo = new THREE.BoxGeometry(0.7, 0.15, 0.4);
    const leftBrow = new THREE.Mesh(browGeo, skinDarkMaterial);
    leftBrow.position.set(0.65, 0.75, 0.9);
    leftBrow.rotation.z = -0.4;
    leftBrow.rotation.y = 0.4;
    dragonGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, skinDarkMaterial);
    rightBrow.position.set(-0.65, 0.75, 0.9);
    rightBrow.rotation.z = 0.4;
    rightBrow.rotation.y = -0.4;
    dragonGroup.add(rightBrow);

    // Horns (Large, curved back)
    const hornGeo = new THREE.ConeGeometry(0.15, 1.8, 5);
    const leftHorn = new THREE.Mesh(hornGeo, hornMaterial);
    leftHorn.position.set(0.7, 1.6, -0.2);
    leftHorn.rotation.x = -0.6; // Tilt back
    leftHorn.rotation.z = -0.2; // Flare out
    dragonGroup.add(leftHorn);

    const rightHorn = new THREE.Mesh(hornGeo, hornMaterial);
    rightHorn.position.set(-0.7, 1.6, -0.2);
    rightHorn.rotation.x = -0.6;
    rightHorn.rotation.z = 0.2;
    dragonGroup.add(rightHorn);
    
    // Cheek Spikes (Adding width and detail)
    const cheekGeo = new THREE.ConeGeometry(0.12, 0.6, 4);
    const leftCheek = new THREE.Mesh(cheekGeo, hornMaterial);
    leftCheek.position.set(1.1, 0, 0.6);
    leftCheek.rotation.z = -1.4;
    leftCheek.rotation.y = 0.3;
    dragonGroup.add(leftCheek);
    
    const rightCheek = new THREE.Mesh(cheekGeo, hornMaterial);
    rightCheek.position.set(-1.1, 0, 0.6);
    rightCheek.rotation.z = 1.4;
    rightCheek.rotation.y = -0.3;
    dragonGroup.add(rightCheek);

    // Mouth Interior (Fire Origin)
    // Positioned just in front of the throat, between snout and jaw
    mouthPositionRef.current.set(0, -0.3, 2.2);

    scene.add(dragonGroup);
    dragonGroupRef.current = dragonGroup;

    // --- Particle System ---
    // Using a BufferGeometry for high performance with thousands of particles
    const maxParticles = 2000;
    const particlePositions = new Float32Array(maxParticles * 3);
    const particleColors = new Float32Array(maxParticles * 3);
    const particleSizes = new Float32Array(maxParticles);
    
    // Initialize off-screen
    for (let i = 0; i < maxParticles; i++) {
      particlePositions[i * 3 + 0] = 0;
      particlePositions[i * 3 + 1] = 0;
      particlePositions[i * 3 + 2] = 0;
      particleSizes[i] = 0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    particleGeometryRef.current = geometry;

    // Generate a soft circular texture programmatically
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 1.0,
      vertexColors: true,
      map: texture,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    particleMaterialRef.current = material;

    const points = new THREE.Points(geometry, material);
    scene.add(points);
    pointsRef.current = points;

    // --- Animation Loop ---
    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Dragon idle movement
      if (dragonGroupRef.current) {
        // Complex idle animation
        dragonGroupRef.current.position.y = Math.sin(time * 1.2) * 0.15; // Vertical bob
        dragonGroupRef.current.rotation.y = Math.sin(time * 0.4) * 0.08; // Horizontal sway
        dragonGroupRef.current.rotation.x = Math.sin(time * 0.8) * 0.03; // Subtle nod
      }

      // Update Particles
      // We process the `particlesRef.current` logic array and sync to BufferGeometry
      const particles = particlesRef.current;
      const positions = particleGeometryRef.current!.attributes.position.array as Float32Array;
      const colors = particleGeometryRef.current!.attributes.color.array as Float32Array;
      const sizes = particleGeometryRef.current!.attributes.size.array as Float32Array;

      // Update existing particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= delta;
        
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Movement
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.z += p.vz * delta;

        // Visual evolution based on life percentage
        const lifeRatio = p.life / p.maxLife;
        
        // Color transition
        let targetColor;
        if (p.type === 'fire') {
          // White -> Orange -> Red -> Dark
          if (lifeRatio > 0.8) targetColor = FIRE_COLORS.CORE;
          else if (lifeRatio > 0.4) targetColor = FIRE_COLORS.MID;
          else targetColor = FIRE_COLORS.OUTER;
          p.size = (1 - lifeRatio) * 4.0; // Grow as they age
        } else {
          // Grey smoke
          targetColor = FIRE_COLORS.SMOKE;
          p.size = (1 - lifeRatio) * 2.0;
        }

        // Apply to Geometry buffers
        const idx = i; // Map 1:1 for simplicity in this MVP (optimization: use a ring buffer)
        if (idx < maxParticles) {
            positions[idx * 3] = p.x;
            positions[idx * 3 + 1] = p.y;
            positions[idx * 3 + 2] = p.z;
            
            colors[idx * 3] = targetColor.r;
            colors[idx * 3 + 1] = targetColor.g;
            colors[idx * 3 + 2] = targetColor.b;
            
            sizes[idx] = p.size;
        }
      }

      // Hide unused particles in buffer
      for (let i = particles.length; i < maxParticles; i++) {
        sizes[i] = 0;
      }

      if (particleGeometryRef.current) {
        particleGeometryRef.current.attributes.position.needsUpdate = true;
        particleGeometryRef.current.attributes.color.needsUpdate = true;
        particleGeometryRef.current.attributes.size.needsUpdate = true;
      }
      
      // Dynamic lighting intensity
      if (fireLight) {
          // Flicker effect
          const intensityTarget = particles.filter(p => p.type === 'fire').length * 0.05;
          fireLight.intensity = THREE.MathUtils.lerp(fireLight.intensity, Math.min(intensityTarget, 8), 0.1);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      geometry.dispose();
      material.dispose();
      // Dispose meshes
      scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
              object.geometry.dispose();
              if (object.material instanceof THREE.Material) {
                   object.material.dispose();
              }
          }
      });
    };
  }, []);

  // --- Breath Handling Hook ---
  useEffect(() => {
    // This effect runs whenever breathStats changes to spawn new particles
    if (breathStats.isBreathing) {
      continuousBreathTimeRef.current = Math.min(continuousBreathTimeRef.current + 0.1, 10); // Clamp tracking
      
      const isEpic = continuousBreathTimeRef.current > GAME_SETTINGS.EPIC_BREATH_THRESHOLD;
      const count = isEpic ? GAME_SETTINGS.PARTICLE_SPAWN_RATE * 2 : GAME_SETTINGS.PARTICLE_SPAWN_RATE;

      for (let i = 0; i < count; i++) {
         if (particlesRef.current.length >= 1900) break; // Safety cap

         // Random spread from mouth
         const spread = isEpic ? 0.5 : 0.2;
         const speed = isEpic ? 8.0 : 3.0;
         const life = isEpic ? 2.0 : 1.5;
         
         // Start at mouth (transformed by dragon rotation approx)
         // For true precision we would use dragonGroupRef.current.localToWorld but approximation is fine for MVP
         const startX = (Math.random() - 0.5) * 0.5;
         const startY = -0.3 + (Math.random() - 0.5) * 0.2; // Updated relative to mouth Y
         const startZ = 2.2; // Updated Z

         particlesRef.current.push({
           x: startX,
           y: startY,
           z: startZ,
           vx: (Math.random() - 0.5) * spread,
           vy: (Math.random() - 0.5) * spread,
           vz: speed + (Math.random() * 2),
           life: life,
           maxLife: life,
           size: Math.random(),
           type: isEpic ? 'fire' : 'smoke'
         });
      }
    } else {
      continuousBreathTimeRef.current = 0;
    }
  }, [breathStats]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default DragonScene;