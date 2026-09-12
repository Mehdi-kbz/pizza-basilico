"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Pizza 3D procédurale — tout est généré (géométries + textures canvas) :
 * aucune photo ni modèle externe requis.
 *
 * Clé du rendu appétissant : la mozzarella n'est PAS une couche uniforme mais
 * une série de pâtés distincts, avec la sauce qui affleure entre eux — comme
 * sur une vraie napolitaine. Le cornicione est déformé et constellé de cloques
 * carbonisées plutôt que lissé.
 */

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Générateur pseudo-aléatoire déterministe : même pizza à chaque visite. */
function makeRng(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/* ----------------------------- Textures canvas ---------------------------- */

function makeCtx(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  return { canvas, ctx: canvas.getContext("2d")! };
}

/** Pâte cuite au feu de bois : doré inégal, farine, éclats carbonisés. */
function createDoughTexture() {
  const { canvas, ctx } = makeCtx(512);
  const rng = makeRng(7);

  ctx.fillStyle = "#d7a862";
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 340; i++) {
    const r = 6 + rng() * 40;
    ctx.beginPath();
    const tone = rng();
    ctx.fillStyle =
      tone > 0.78
        ? `rgba(104, 58, 24, ${0.16 + rng() * 0.26})`
        : tone > 0.4
          ? `rgba(228, 184, 118, ${0.12 + rng() * 0.26})`
          : `rgba(176, 122, 58, ${0.1 + rng() * 0.22})`;
    ctx.arc(rng() * 512, rng() * 512, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // éclats franchement carbonisés
  for (let i = 0; i < 46; i++) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(34, 19, 10, ${0.4 + rng() * 0.4})`;
    ctx.ellipse(rng() * 512, rng() * 512, 2 + rng() * 8, 2 + rng() * 6, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // voile de farine
  for (let i = 0; i < 120; i++) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(248, 238, 214, ${0.05 + rng() * 0.12})`;
    ctx.arc(rng() * 512, rng() * 512, 1 + rng() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.2, 2.2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Sauce tomate : rouge profond, grumeleux, plus sombre sur les bords. */
function createSauceTexture() {
  const { canvas, ctx } = makeCtx(512);
  const rng = makeRng(23);

  ctx.fillStyle = "#a32a1c";
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 260; i++) {
    ctx.beginPath();
    ctx.fillStyle =
      rng() > 0.5
        ? `rgba(196, 62, 38, ${0.2 + rng() * 0.4})`
        : `rgba(120, 26, 16, ${0.2 + rng() * 0.45})`;
    ctx.ellipse(rng() * 512, rng() * 512, 6 + rng() * 26, 5 + rng() * 20, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  // pulpe / graines
  for (let i = 0; i < 90; i++) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(230, 160, 90, ${0.18 + rng() * 0.3})`;
    ctx.arc(rng() * 512, rng() * 512, 1.5 + rng() * 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ------------------------------- Géométries ------------------------------ */

/** Feuille de basilic nervurée, légèrement galbée. */
function useLeafGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.52);
    shape.bezierCurveTo(0.44, -0.24, 0.34, 0.3, 0, 0.54);
    shape.bezierCurveTo(-0.34, 0.3, -0.44, -0.24, 0, -0.52);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.03,
      bevelEnabled: true,
      bevelSize: 0.022,
      bevelThickness: 0.014,
      bevelSegments: 2,
      curveSegments: 22,
    });
    geo.center();

    // galbe très léger : les bords retombent à peine (sinon la feuille se plie
    // en deux et n'est plus lisible vue du dessus)
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setZ(i, pos.getZ(i) - Math.abs(x) * 0.08);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);
}

/** Base de pâte irrégulière (jamais un disque parfait). */
function useDoughGeometry() {
  return useMemo(() => {
    const geo = new THREE.CylinderGeometry(1.86, 1.8, 0.125, 128, 1);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const a = Math.atan2(v.z, v.x);
      const dist = Math.hypot(v.x, v.z);
      if (dist > 0.2) {
        const wobble = Math.sin(a * 6) * 0.03 + Math.cos(a * 3.3) * 0.035 + Math.sin(a * 11) * 0.012;
        const scale = 1 + wobble / dist;
        v.x *= scale;
        v.z *= scale;
        pos.setXYZ(i, v.x, v.y, v.z);
      }
    }
    geo.computeVertexNormals();
    return geo;
  }, []);
}

/** Cornicione : tore déformé pour un bord gonflé inégal. */
function useCrustGeometry() {
  return useMemo(() => {
    const geo = new THREE.TorusGeometry(1.9, 0.1, 24, 140);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const a = Math.atan2(v.y, v.x);
      const bump = 1 + Math.sin(a * 8) * 0.03 + Math.cos(a * 5.5) * 0.028 + Math.sin(a * 17) * 0.012;
      pos.setXYZ(i, v.x * bump, v.y * bump, v.z * (1 + Math.sin(a * 9) * 0.07));
    }
    geo.computeVertexNormals();
    return geo;
  }, []);
}

/* -------------------------------- Garnitures ------------------------------ */

/** Pâtés de mozzarella fondue — l'élément qui rend la pizza crédible. */
function Mozzarella() {
  const blobs = useMemo(() => {
    const rng = makeRng(41);
    const out: { pos: [number, number, number]; scale: [number, number, number]; rot: number; warm: number }[] = [];
    // Beaucoup de petits pâtés fondus plutôt que quelques grosses boules :
    // c'est ce qui fait la différence entre « mozzarella » et « guimauve ».
    const rings = [
      { count: 4, radius: 0.3 },
      { count: 8, radius: 0.75 },
      { count: 11, radius: 1.2 },
      { count: 11, radius: 1.55 },
    ];
    for (const ring of rings) {
      for (let i = 0; i < ring.count; i++) {
        const angle = (i / ring.count) * Math.PI * 2 + rng() * 0.9;
        const radius = ring.radius + (rng() - 0.5) * 0.2;
        const s = 0.15 + rng() * 0.11;
        out.push({
          pos: [Math.cos(angle) * radius, 0.088, Math.sin(angle) * radius],
          scale: [s, 0.045 + rng() * 0.035, s * (0.72 + rng() * 0.5)],
          rot: rng() * Math.PI,
          warm: rng(),
        });
      }
    }
    return out;
  }, []);

  return (
    <group>
      {blobs.map((b, i) => (
        <mesh key={i} position={b.pos} scale={b.scale} rotation={[0, b.rot, 0]} castShadow>
          <sphereGeometry args={[1, 22, 14]} />
          <meshStandardMaterial
            color={b.warm > 0.78 ? "#d8ae6b" : b.warm > 0.45 ? "#eddcb4" : "#f4e8cd"}
            roughness={0.22 + b.warm * 0.22}
            metalness={0.04}
          />
        </mesh>
      ))}
    </group>
  );
}

function Toppings() {
  const leaf = useLeafGeometry();

  const { basil, tomatoes, flakes, blisters } = useMemo(() => {
    const rng = makeRng(89);
    const basil = Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2 + rng() * 0.6;
      const radius = 0.42 + rng() * 1.12;
      return {
        pos: [Math.cos(angle) * radius, 0.155, Math.sin(angle) * radius] as [number, number, number],
        rot: rng() * Math.PI * 2,
        tilt: (rng() - 0.5) * 0.22,
        scale: 0.42 + rng() * 0.2,
        dark: rng(),
      };
    });

    const tomatoes = Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2 + rng() * 0.8;
      const radius = 0.55 + rng() * 1.0;
      return {
        pos: [Math.cos(angle) * radius, 0.145, Math.sin(angle) * radius] as [number, number, number],
        scale: 0.15 + rng() * 0.07,
        rot: rng() * Math.PI,
      };
    });

    const flakes = Array.from({ length: 26 }, () => {
      const angle = rng() * Math.PI * 2;
      const radius = 0.25 + rng() * 1.5;
      return {
        pos: [Math.cos(angle) * radius, 0.16, Math.sin(angle) * radius] as [number, number, number],
        rot: rng() * Math.PI,
        scale: 0.03 + rng() * 0.035,
      };
    });

    // cloques carbonisées sur le cornicione
    const blisters = Array.from({ length: 12 }, () => {
      const angle = rng() * Math.PI * 2;
      return {
        pos: [Math.cos(angle) * 1.88, 0.12 + rng() * 0.04, Math.sin(angle) * 1.88] as [number, number, number],
        scale: 0.03 + rng() * 0.032,
      };
    });

    return { basil, tomatoes, flakes, blisters };
  }, []);

  return (
    <group>
      {basil.map((b, i) => (
        <mesh
          key={`b${i}`}
          geometry={leaf}
          position={b.pos}
          rotation={[-Math.PI / 2 + b.tilt, b.rot, 0]}
          scale={b.scale}
          castShadow
        >
          <meshStandardMaterial color={b.dark > 0.5 ? "#3c6b27" : "#4c8432"} roughness={0.62} metalness={0} />
        </mesh>
      ))}

      {/* Tomates cerises coupées : dôme aplati + cœur plus clair */}
      {tomatoes.map((t, i) => (
        <group key={`t${i}`} position={t.pos} rotation={[0, t.rot, 0]}>
          <mesh scale={[t.scale, t.scale * 0.52, t.scale]} castShadow>
            <sphereGeometry args={[1, 22, 16]} />
            <meshStandardMaterial color="#a82b1e" roughness={0.38} metalness={0.02} />
          </mesh>
        </group>
      ))}

      {flakes.map((f, i) => (
        <mesh key={`f${i}`} position={f.pos} rotation={[0, f.rot, 0]} scale={[f.scale, f.scale * 0.22, f.scale * 0.7]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#f5e9c8" roughness={0.66} />
        </mesh>
      ))}

      {blisters.map((bl, i) => (
        <mesh key={`bl${i}`} position={bl.pos} scale={bl.scale}>
          <sphereGeometry args={[1, 12, 10]} />
          <meshStandardMaterial color="#2a170c" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------------------------- Pizza --------------------------------- */

function PizzaModel({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const doughGeo = useDoughGeometry();
  const crustGeo = useCrustGeometry();
  const doughTex = useMemo(() => createDoughTexture(), []);
  const sauceTex = useMemo(() => createSauceTexture(), []);

  useEffect(() => () => {
    doughTex.dispose();
    sauceTex.dispose();
  }, [doughTex, sauceTex]);

  useFrame((state, delta) => {
    if (!group.current) return;
    if (reduced) {
      group.current.rotation.set(0.07, -0.4, 0);
      return;
    }
    group.current.rotation.y += delta * 0.15;
    group.current.rotation.x = 0.07 + Math.sin(state.clock.elapsedTime * 0.5) * 0.018;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.65) * 0.05;
  });

  return (
    <group ref={group} rotation={[0.07, -0.4, 0]} scale={1.08}>
      {/* Pâte */}
      <mesh geometry={doughGeo} castShadow receiveShadow>
        <meshStandardMaterial map={doughTex} roughness={0.88} metalness={0} />
      </mesh>

      {/* Cornicione */}
      <mesh geometry={crustGeo} position={[0, 0.035, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={doughTex} color="#cd9a58" roughness={0.9} metalness={0} />
      </mesh>

      {/* Sauce — visible entre les pâtés de mozzarella */}
      <mesh position={[0, 0.072, 0]} receiveShadow>
        <cylinderGeometry args={[1.76, 1.74, 0.035, 96]} />
        <meshStandardMaterial map={sauceTex} roughness={0.58} metalness={0.01} />
      </mesh>

      <Mozzarella />
      <Toppings />
    </group>
  );
}

function Scene({ reduced }: { reduced: boolean }) {
  return (
    <>
      <ambientLight intensity={0.28} color="#ffd2a0" />

      {/* Lumière clé : gueule du four, haut-droite */}
      <directionalLight position={[3.6, 7, 3] } intensity={2.7} color="#fff1d6" castShadow shadow-mapSize={[1536, 1536]}>
        <orthographicCamera attach="shadow-camera" args={[-4.5, 4.5, 4.5, -4.5, 0.1, 24]} />
      </directionalLight>

      {/* Braises : rasant, derrière-gauche */}
      <pointLight position={[-3.3, 0.9, -2.2]} intensity={26} color="#ff5d12" distance={11} decay={2} />
      <pointLight position={[2.7, 0.6, -2.9]} intensity={15} color="#ff9040" distance={10} decay={2} />

      {/* Petit appoint froid pour détacher la silhouette du fond noir */}
      <directionalLight position={[-1.5, 3, 4.5]} intensity={0.32} color="#b9d2ff" />

      <PizzaModel reduced={reduced} />

      <ContactShadows position={[0, -0.4, 0]} opacity={0.62} scale={10} blur={2.4} far={4.5} color="#000000" />
    </>
  );
}

export default function Pizza3D({ className = "" }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 2.5, 5], fov: 40 }}
        dpr={[1, 1.9]}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
        shadows
        style={{ background: "transparent" }}
      >
        <Scene reduced={reduced} />
      </Canvas>
    </div>
  );
}
