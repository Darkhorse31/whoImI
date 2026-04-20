"use client";

import { useRef, useMemo, useCallback, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ─────────────────────── Constants ─────────────────────── */
const STAR_COUNT = 1800;
const SHOOTING_INTERVAL = 4000; // ms between shooting stars

/* ─────────────────────── Star data ─────────────────────── */
function generateStarData(count: number) {
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count); // twinkle phase
  const speeds = new Float32Array(count); // twinkle speed
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // distribute on a hemisphere dome
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(1 - Math.random() * 0.85); // bias toward horizon
    const r = 40 + Math.random() * 60;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi) + 5; // push upward
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    phases[i] = Math.random() * Math.PI * 2;
    speeds[i] = 0.3 + Math.random() * 1.5;
    sizes[i] = 0.15 + Math.random() * 0.55;
  }
  return { positions, phases, speeds, sizes };
}

/* ─────────────────────── Vertex shader ─────────────────────── */
const starVertexShader = /* glsl */ `
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aSize;
  uniform float uTime;
  uniform vec2 uMouse;
  varying float vBrightness;
  varying float vDist;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float dist = length(mvPosition.xyz);

    // twinkle
    float twinkle = sin(uTime * aSpeed + aPhase) * 0.5 + 0.5;
    twinkle = twinkle * twinkle; // sharpen
    vBrightness = 0.3 + twinkle * 0.7;

    // mouse proximity boost (in screen space)
    vec4 projected = projectionMatrix * mvPosition;
    vec2 ndc = projected.xy / projected.w;
    float mouseDist = length(ndc - uMouse);
    vBrightness += smoothstep(0.4, 0.0, mouseDist) * 0.6;

    vDist = dist;
    gl_PointSize = aSize * (300.0 / dist) * (0.6 + twinkle * 0.4);
    gl_Position = projected;
  }
`;

/* ─────────────────────── Fragment shader ─────────────────────── */
const starFragmentShader = /* glsl */ `
  varying float vBrightness;
  varying float vDist;

  void main() {
    // soft circle falloff
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.08, d);

    // core glow: white center → blue-ish edge
    vec3 core = vec3(1.0, 1.0, 1.0);
    vec3 edge = vec3(0.6, 0.75, 1.0);
    vec3 color = mix(edge, core, smoothstep(0.35, 0.0, d));

    gl_FragColor = vec4(color * vBrightness, alpha * vBrightness);
  }
`;

/* ─────────────────────── Aurora wave shader ─────────────────────── */
const auroraVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const auroraFragmentShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    float wave1 = sin(vUv.x * 6.0 + uTime * 0.5) * 0.5 + 0.5;
    float wave2 = sin(vUv.x * 10.0 - uTime * 0.3 + 1.5) * 0.5 + 0.5;
    float wave3 = sin(vUv.x * 4.0 + uTime * 0.8 + 3.0) * 0.5 + 0.5;
    float combined = (wave1 + wave2 * 0.5 + wave3 * 0.3) / 1.8;

    // vertical fade: strongest near bottom of the plane
    float vFade = smoothstep(1.0, 0.0, vUv.y) * smoothstep(0.0, 0.3, vUv.y);

    // colors: purple-blue-teal gradient
    vec3 c1 = vec3(0.3, 0.1, 0.6);  // purple
    vec3 c2 = vec3(0.1, 0.3, 0.8);  // blue
    vec3 c3 = vec3(0.05, 0.6, 0.7); // teal
    vec3 color = mix(c1, c2, combined);
    color = mix(color, c3, wave3 * 0.4);

    float alpha = combined * vFade * 0.35;
    gl_FragColor = vec4(color, alpha);
  }
`;

/* ─────────────────────── Shooting star ─────────────────────── */
function ShootingStar() {
  const ref = useRef<THREE.Mesh>(null!);
  const trailRef = useRef<THREE.Mesh>(null!);
  const state = useRef({
    active: false,
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    life: 0,
    maxLife: 0,
  });

  const spawn = useCallback(() => {
    const s = state.current;
    s.active = true;
    s.life = 0;
    s.maxLife = 0.6 + Math.random() * 0.5;
    const startX = (Math.random() - 0.5) * 80;
    const startY = 25 + Math.random() * 25;
    const startZ = -20 - Math.random() * 30;
    s.pos.set(startX, startY, startZ);
    const angle = -0.3 - Math.random() * 0.4;
    const speed = 60 + Math.random() * 40;
    s.vel.set(Math.cos(angle) * speed, Math.sin(angle) * speed, 0);
  }, []);

  useEffect(() => {
    const id = setInterval(spawn, SHOOTING_INTERVAL + Math.random() * 2000);
    const timeout = setTimeout(spawn, 500 + Math.random() * 2000);
    return () => {
      clearInterval(id);
      clearTimeout(timeout);
    };
  }, [spawn]);

  useFrame((_, delta) => {
    const s = state.current;
    if (!s.active) return;
    s.life += delta;
    if (s.life > s.maxLife) {
      s.active = false;
      if (ref.current) ref.current.visible = false;
      if (trailRef.current) trailRef.current.visible = false;
      return;
    }

    const t = s.life / s.maxLife;
    const fade = t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8;
    s.pos.addScaledVector(s.vel, delta);

    if (ref.current) {
      ref.current.visible = true;
      ref.current.position.copy(s.pos);
      ref.current.scale.setScalar(fade * 0.8);
    }
    if (trailRef.current) {
      trailRef.current.visible = true;
      trailRef.current.position.copy(s.pos);
      trailRef.current.scale.set(fade * 3, fade * 0.15, 1);
      const angle = Math.atan2(s.vel.y, s.vel.x);
      trailRef.current.rotation.z = angle;
    }
  });

  return (
    <>
      <mesh ref={ref} visible={false}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
      <mesh ref={trailRef} visible={false}>
        <planeGeometry args={[6, 0.3]} />
        <meshBasicMaterial
          color="#aaccff"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

/* ─────────────────────── Interactive click burst ─────────────────────── */
function ClickBurst() {
  const count = 30;
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { camera, raycaster, pointer } = useThree();

  const particles = useRef(
    Array.from({ length: count }, () => ({
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      life: 0,
      maxLife: 0,
      active: false,
    }))
  );

  const spawn = useCallback(
    (origin: THREE.Vector3) => {
      const ps = particles.current;
      for (let i = 0; i < count; i++) {
        ps[i].pos.copy(origin);
        ps[i].vel.set(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8
        );
        ps[i].life = 0;
        ps[i].maxLife = 0.4 + Math.random() * 0.6;
        ps[i].active = true;
      }
    },
    []
  );

  useEffect(() => {
    const onClick = () => {
      raycaster.setFromCamera(pointer, camera);
      const dir = raycaster.ray.direction.clone().multiplyScalar(30);
      const origin = camera.position.clone().add(dir);
      spawn(origin);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [camera, raycaster, pointer, spawn]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const ps = particles.current;
    for (let i = 0; i < count; i++) {
      const p = ps[i];
      if (!p.active) {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        continue;
      }
      p.life += delta;
      if (p.life > p.maxLife) {
        p.active = false;
        dummy.scale.setScalar(0);
      } else {
        p.pos.addScaledVector(p.vel, delta);
        p.vel.multiplyScalar(0.96);
        const t = p.life / p.maxLife;
        const s = (1 - t) * 0.15;
        dummy.position.copy(p.pos);
        dummy.scale.setScalar(s);
      }
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color="#88bbff"
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}

/* ─────────────────────── Stars points ─────────────────────── */
function Stars() {
  const pointsRef = useRef<THREE.Points>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const mouse = useRef(new THREE.Vector2(0, 0));

  const { positions, phases, speeds, sizes } = useMemo(
    () => generateStarData(STAR_COUNT),
    []
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      materialRef.current.uniforms.uMouse.value.copy(mouse.current);
    }
    // slow rotation of the whole sky dome
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.00008;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={STAR_COUNT}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          args={[phases, 1]}
          count={STAR_COUNT}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aSpeed"
          args={[speeds, 1]}
          count={STAR_COUNT}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
          count={STAR_COUNT}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0, 0) },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ─────────────────────── Aurora wave plane ─────────────────────── */
function AuroraWave() {
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh position={[0, -8, -30]} rotation={[-0.1, 0, 0]}>
      <planeGeometry args={[120, 20, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={auroraVertexShader}
        fragmentShader={auroraFragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ─────────────────────── Scene ─────────────────────── */
function NightScene() {
  return (
    <>
      <Stars />
      <AuroraWave />
      <ShootingStar />
      <ShootingStar />
      <ClickBurst />
    </>
  );
}

/* ─────────────────────── Export ─────────────────────── */
export default function StarField3D() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-auto">
      <Canvas
        camera={{ position: [0, 5, 20], fov: 60, near: 0.1, far: 200 }}
        gl={{ alpha: true, antialias: false }}
        style={{ background: "transparent" }}
        dpr={[1, 1.5]}
      >
        <NightScene />
      </Canvas>
    </div>
  );
}
