"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { usePathname } from "next/navigation";
import * as THREE from "three";

/* ─── Particle system (fast on hold, slow on hover) ─── */
function Particles({ active, hovering, navigating }: { active: boolean; hovering: boolean; navigating: boolean }) {
  const count = 200;
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const frameCount = useRef(0);

  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        position: new THREE.Vector3(0, 0, 0),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.08,
          (Math.random() - 0.5) * 0.08,
          (Math.random() - 0.5) * 0.08
        ),
        life: 0,
        maxLife: 60 + Math.random() * 80,
        scale: 0.01 + Math.random() * 0.025,
      });
    }
    return arr;
  }, []);

  const spawnIndex = useRef(0);
  const activeRef = useRef(false);
  const hoveringRef = useRef(false);
  const navigatingRef = useRef(false);
  activeRef.current = active;
  hoveringRef.current = hovering;
  navigatingRef.current = navigating;

  useFrame(() => {
    if (!meshRef.current) return;
    frameCount.current++;

    // Fast burst on hold (3 per frame)
    if (activeRef.current) {
      for (let s = 0; s < 3; s++) {
        const p = particles[spawnIndex.current % count];
        p.position.set(0, 0, 0);
        p.velocity.set(
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1
        );
        p.life = 0;
        spawnIndex.current++;
      }
    }
    // Medium burst on page navigation (2 per frame, faster velocity)
    else if (navigatingRef.current) {
      for (let s = 0; s < 2; s++) {
        const p = particles[spawnIndex.current % count];
        p.position.set(0, 0, 0);
        p.velocity.set(
          (Math.random() - 0.5) * 0.14,
          (Math.random() - 0.5) * 0.14,
          (Math.random() - 0.5) * 0.14
        );
        p.life = 0;
        p.maxLife = 50 + Math.random() * 40;
        spawnIndex.current++;
      }
    }
    // Slow emit on hover (1 particle every 6 frames)
    else if (hoveringRef.current && frameCount.current % 6 === 0) {
      const p = particles[spawnIndex.current % count];
      p.position.set(0, 0, 0);
      p.velocity.set(
        (Math.random() - 0.5) * 0.04,
        (Math.random() - 0.5) * 0.04,
        (Math.random() - 0.5) * 0.04
      );
      p.life = 0;
      p.maxLife = 80 + Math.random() * 60;
      spawnIndex.current++;
    }

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      p.life++;
      p.position.add(p.velocity);
      p.velocity.multiplyScalar(0.97);

      const lifeRatio = p.life / p.maxLife;
      const scl = lifeRatio > 1 ? 0 : p.scale * (1 - lifeRatio);

      dummy.position.copy(p.position);
      dummy.scale.set(scl, scl, scl);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Color each particle instance with red shade variation
  const redShades = useMemo(() => [
    new THREE.Color("#fafafa"),
    new THREE.Color("#e0e0e0"),
    new THREE.Color("#ffffff"),
    new THREE.Color("#c8c8c8"),
    new THREE.Color("#f0f0f0"),
    new THREE.Color("#d5d5d5"),
  ], []);

  // Set per-instance colors
  const colorArray = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const c = redShades[i % redShades.length];
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    return arr;
  }, [count, redShades]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]}>
        <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
      </sphereGeometry>
      <meshBasicMaterial vertexColors transparent opacity={0.85} />
    </instancedMesh>
  );
}

/* ─── Main geometric shape ─── */
function GeometricShape() {
  const groupRef = useRef<THREE.Group>(null!);
  const wireRef = useRef<THREE.Mesh>(null!);
  const innerRef = useRef<THREE.Mesh>(null!);
  const scrollY = useRef(0);
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentPage = useRef(0);
  const pathname = usePathname();
  const { viewport } = useThree();

  // Particle state
  const [particlesActive, setParticlesActive] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHolding = useRef(false);

  // Map page to rotation offset
  const pageMap: Record<string, number> = useMemo(
    () => ({
      "/": 0,
      "/about": 1,
      "/projects": 2,
      "/experience": 3,
      "/contact": 4,
    }),
    []
  );

  // Page navigation particle burst
  const [isNavigating, setIsNavigating] = useState(false);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    currentPage.current = pageMap[pathname] ?? 0;
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setIsNavigating(true);
      const timer = setTimeout(() => setIsNavigating(false), 700);
      return () => clearTimeout(timer);
    }
  }, [pathname, pageMap]);

  // Scroll listener
  useEffect(() => {
    const onScroll = () => {
      scrollY.current = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Click and hold handlers
  const onPointerDown = useCallback(() => {
    isHolding.current = true;
    holdTimer.current = setTimeout(() => {
      if (isHolding.current) {
        setParticlesActive(true);
      }
    }, 3000);
  }, []);

  const onPointerUp = useCallback(() => {
    isHolding.current = false;
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    setParticlesActive(false);
  }, []);

  const onPointerEnter = useCallback(() => setIsHovered(true), []);
  const onPointerLeaveHandler = useCallback(() => {
    setIsHovered(false);
    // Also cancel hold
    isHolding.current = false;
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    setParticlesActive(false);
  }, []);

  // Spring-bounce state for debounce animation on particle emit
  const springScale = useRef(1);
  const springVelocity = useRef(0);
  const wasEmitting = useRef(false);

  // Smooth position for scroll-based floating
  const smoothPos = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;
    const scrollFactor = scrollY.current * 0.001;
    const pageOffset = currentPage.current * Math.PI * 0.5;

    // Smooth rotation targets
    targetRotation.current.x = scrollFactor * 0.8 + pageOffset * 0.3 + time * 0.05;
    targetRotation.current.y = scrollFactor * 0.5 + pageOffset * 0.5 + time * 0.08;

    // Lerp rotation
    groupRef.current.rotation.x += (targetRotation.current.x - groupRef.current.rotation.x) * 0.03;
    groupRef.current.rotation.y += (targetRotation.current.y - groupRef.current.rotation.y) * 0.03;

    // ─── Smooth scroll-based position ───
    // Vertical: float based on scroll + sine wave
    // Horizontal: slight drift per page
    const scrollDriftY = -scrollFactor * 0.6 + Math.sin(time * 0.4) * 0.2;
    const scrollDriftX = Math.sin(scrollFactor * 0.5 + pageOffset) * 0.3;
    const targetPos = new THREE.Vector3(scrollDriftX, scrollDriftY, 0);

    // Damped lerp for silky smooth movement
    smoothPos.current.lerp(targetPos, 0.025);
    groupRef.current.position.copy(smoothPos.current);

    // ─── Spring debounce on particle emit ───
    const isEmitting = particlesActive || isNavigating || isHovered;

    // Trigger bounce on emission start
    if (isEmitting && !wasEmitting.current) {
      springVelocity.current = 0.15; // kick
    }
    wasEmitting.current = isEmitting;

    // Spring physics: stiffness 180, damping 12
    const stiffness = 180;
    const damping = 12;
    const restScale = isEmitting ? 1.08 : 1;
    const displacement = springScale.current - restScale;
    const springForce = -stiffness * displacement;
    const dampForce = -damping * springVelocity.current;
    springVelocity.current += (springForce + dampForce) * (1 / 60);
    springScale.current += springVelocity.current * (1 / 60);

    // Apply spring scale to the whole group
    const s = springScale.current;
    groupRef.current.scale.set(s, s, s);

    // Inner mesh counter-rotates slowly
    if (innerRef.current) {
      innerRef.current.rotation.x = -time * 0.15;
      innerRef.current.rotation.z = time * 0.1;
    }
  });

  const size = Math.min(viewport.width, viewport.height) * 0.22;

  return (
    <group
      ref={groupRef}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeaveHandler}
    >
      {/* Outer wireframe icosahedron */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[size, 1]} />
        <meshBasicMaterial
          color="#fafafa"
          wireframe
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Inner solid shape */}
      <mesh ref={innerRef}>
        <octahedronGeometry args={[size * 0.35, 0]} />
        <meshBasicMaterial
          color="#fafafa"
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Center glow point */}
      <mesh>
        <sphereGeometry args={[size * 0.06, 16, 16]} />
        <meshBasicMaterial color="#fafafa" transparent opacity={0.7} />
      </mesh>

      {/* Outer glow halo */}
      <mesh>
        <sphereGeometry args={[size * 0.12, 16, 16]} />
        <meshBasicMaterial color="#fafafa" transparent opacity={0.08} />
      </mesh>

      {/* Particles */}
      <Particles active={particlesActive} hovering={isHovered} navigating={isNavigating} />
    </group>
  );
}

/* ─── Canvas wrapper ─── */
export default function InteractiveModel() {
  return (
    <div
      className="fixed top-0 right-0 w-[40vw] h-screen z-10 pointer-events-none"
      style={{ mixBlendMode: "screen" }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.5]}
        style={{ pointerEvents: "auto" }}
        gl={{ antialias: true, alpha: true }}
      >
        <GeometricShape />
      </Canvas>
    </div>
  );
}
