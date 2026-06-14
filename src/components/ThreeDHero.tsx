'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

/* ------------------------------------------------------------------ */
/* "MASA SAHNESİ" — sinematik restoran masası                          */
/*                                                                     */
/* Akış (progressRef 0→1, sayfadaki scroll-pin sürer):                 */
/*   0.00  Üstten kuşbakışı: kurulu masa (tabak, çatal-bıçak,          */
/*         fincan, QR standı)                                          */
/*   0.35  Kamera alçalarak masaya süzülür                             */
/*   0.70  QR standına yaklaşır                                        */
/*   1.00  Kod ekranı doldurur → sayfa menü bölümüne bağlanır          */
/*                                                                     */
/* · Tüm objeler prosedürel (model dosyası yok)                        */
/* · QR modülleri InstancedMesh (tek draw call), açılışta dalga pop    */
/* · Masaüstü: gerçek soft shadow; mobil: gölgesiz hafif mod           */
/* ------------------------------------------------------------------ */

// 21×21 QR grid (Version 1)
const QR_GRID: number[][] = [
  [1,1,1,1,1,1,1,0,0,1,0,1,1,0,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,0,1,1,1,0,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,1,0,0,1,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0],
  [1,1,0,1,0,1,1,0,0,0,1,1,1,1,1,0,1,1,0,0,1],
  [0,0,1,0,0,1,0,1,0,1,0,0,0,1,0,0,1,0,1,1,0],
  [1,0,1,1,0,0,1,0,1,0,1,1,0,1,1,1,0,0,1,0,0],
  [0,1,0,0,1,0,1,0,1,1,0,1,0,0,0,1,1,0,1,0,1],
  [1,1,0,1,0,0,0,0,1,0,0,1,0,1,1,0,0,1,0,1,1],
  [0,0,0,0,0,0,0,0,1,1,1,0,1,1,0,0,1,0,0,1,0],
  [1,1,1,1,1,1,1,0,0,1,0,0,0,1,1,1,0,0,1,1,1],
  [1,0,0,0,0,0,1,0,1,0,1,1,0,0,1,0,1,0,1,0,1],
  [1,0,1,1,1,0,1,0,0,1,0,1,0,1,0,1,0,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,1,0,0,1,0,0,0,0,1,1,1,0],
  [1,0,1,1,1,0,1,0,0,1,0,1,1,0,1,1,0,0,1,0,1],
  [1,0,0,0,0,0,1,0,1,0,0,1,0,1,0,1,0,1,0,1,0],
  [1,1,1,1,1,1,1,0,1,1,0,0,1,1,0,1,1,0,1,1,1],
];

const N = 21;

function isFinder(r: number, c: number): boolean {
  return (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/* Prosedürel meşe doku */
function createWoodTexture(): THREE.CanvasTexture {
  const S = 512;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const cx = cv.getContext('2d')!;
  cx.fillStyle = '#a87f52';
  cx.fillRect(0, 0, S, S);
  // damar çizgileri
  for (let i = 0; i < 90; i++) {
    const y = Math.random() * S;
    const w = 1 + Math.random() * 2.5;
    const dark = Math.random() > 0.5;
    cx.strokeStyle = dark ? 'rgba(70, 45, 22, 0.18)' : 'rgba(255, 230, 195, 0.12)';
    cx.lineWidth = w;
    cx.beginPath();
    cx.moveTo(0, y);
    for (let x = 0; x <= S; x += 32) {
      cx.lineTo(x, y + Math.sin(x * 0.02 + i) * 6 + (Math.random() - 0.5) * 3);
    }
    cx.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

export default function ThreeDHero({
  progressRef,
}: {
  progressRef?: React.RefObject<number | null>;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const [ok, setOk] = useState(true);
  const [mob, setMob] = useState(false);

  useEffect(() => {
    const check = () => setMob(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    try {
      const t = document.createElement('canvas');
      if (!(t.getContext('webgl2') || t.getContext('webgl'))) setOk(false);
    } catch {
      setOk(false);
    }
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!ok || !cvRef.current || !boxRef.current) return;
    const canvas = cvRef.current;
    const box = boxRef.current;
    const W = box.clientWidth;
    const H = box.clientHeight;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── RENDERER ── */
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !mob,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mob ? 1.5 : 2));
    renderer.setSize(W, H);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    if (!mob) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    /* ── SCENE & CAMERA ── */
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xfaf9f6, 0.038); // krem sayfa rengine erir

    const cam = new THREE.PerspectiveCamera(35, W / H, 0.1, 60);

    /* ── IŞIK ── */
    const key = new THREE.DirectionalLight(0xfff2dd, 2.4);
    key.position.set(4, 9, 5);
    if (!mob) {
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.near = 1;
      key.shadow.camera.far = 25;
      const sc = 4.5;
      key.shadow.camera.left = -sc;
      key.shadow.camera.right = sc;
      key.shadow.camera.top = sc;
      key.shadow.camera.bottom = -sc;
      key.shadow.bias = -0.0004;
      key.shadow.normalBias = 0.02;
    }
    scene.add(key);
    scene.add(new THREE.HemisphereLight(0xfff7ea, 0x9c8468, 0.6));
    const fill = new THREE.DirectionalLight(0xdfe9ff, 0.5);
    fill.position.set(-5, 4, -3);
    scene.add(fill);

    /* ── MASTER GROUP (kompozisyon + parallax) ── */
    const master = new THREE.Group();
    scene.add(master);

    const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];
    const entranceGroups: THREE.Group[] = [];

    const porcelain = new THREE.MeshPhysicalMaterial({
      color: 0xfffcf6,
      roughness: 0.3,
      clearcoat: 0.4,
      clearcoatRoughness: 0.3,
    });
    const metal = new THREE.MeshStandardMaterial({
      color: 0xd9d9d9,
      roughness: 0.32,
      metalness: 0.9,
    });
    const red = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.45,
      metalness: 0.08,
    });
    disposables.push(porcelain, metal, red);

    const sh = (m: THREE.Mesh) => {
      if (!mob) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
      return m;
    };

    /* ── MASA ── */
    const woodTex = createWoodTexture();
    const woodMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.7,
      metalness: 0.02,
    });
    disposables.push(woodTex, woodMat);
    const tableGeo = new THREE.CylinderGeometry(2.7, 2.7, 0.16, 64);
    disposables.push(tableGeo);
    const table = new THREE.Mesh(tableGeo, woodMat);
    table.position.y = -0.08;
    if (!mob) table.receiveShadow = true;
    master.add(table);

    /* ── TABAK ── */
    const plateG = new THREE.Group();
    plateG.position.set(-1.05, 0, 0.55);
    {
      const baseGeo = new THREE.CylinderGeometry(0.82, 0.66, 0.07, 48);
      const innerGeo = new THREE.CylinderGeometry(0.56, 0.52, 0.025, 48);
      const rimGeo = new THREE.TorusGeometry(0.8, 0.028, 12, 64);
      disposables.push(baseGeo, innerGeo, rimGeo);
      const base = sh(new THREE.Mesh(baseGeo, porcelain));
      base.position.y = 0.04;
      const inner = sh(new THREE.Mesh(innerGeo, porcelain));
      inner.position.y = 0.075;
      const rim = sh(new THREE.Mesh(rimGeo, porcelain));
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.078;
      plateG.add(base, inner, rim);
    }
    master.add(plateG);
    entranceGroups.push(plateG);

    /* ── PEÇETE + ÇATAL (tabağın solu) ── */
    const forkG = new THREE.Group();
    forkG.position.set(-2.0, 0, 0.55);
    {
      const napGeo = new THREE.BoxGeometry(0.26, 0.012, 0.62);
      disposables.push(napGeo);
      const napMat = new THREE.MeshStandardMaterial({ color: 0xf3ece1, roughness: 0.9 });
      disposables.push(napMat);
      const nap = sh(new THREE.Mesh(napGeo, napMat));
      nap.position.y = 0.006;
      forkG.add(nap);

      const handleGeo = new THREE.BoxGeometry(0.055, 0.022, 0.34);
      disposables.push(handleGeo);
      const handle = sh(new THREE.Mesh(handleGeo, metal));
      handle.position.set(0, 0.025, 0.1);
      forkG.add(handle);

      const tineGeo = new THREE.BoxGeometry(0.012, 0.018, 0.17);
      disposables.push(tineGeo);
      for (let i = 0; i < 4; i++) {
        const tine = sh(new THREE.Mesh(tineGeo, metal));
        tine.position.set(-0.027 + i * 0.018, 0.025, -0.155);
        forkG.add(tine);
      }
    }
    master.add(forkG);
    entranceGroups.push(forkG);

    /* ── BIÇAK (tabağın sağı) ── */
    const knifeG = new THREE.Group();
    knifeG.position.set(-0.12, 0, 0.58);
    {
      const bladeGeo = new THREE.BoxGeometry(0.075, 0.014, 0.34);
      const khandleGeo = new THREE.BoxGeometry(0.05, 0.028, 0.26);
      disposables.push(bladeGeo, khandleGeo);
      const blade = sh(new THREE.Mesh(bladeGeo, metal));
      blade.position.set(0, 0.02, -0.14);
      const khandle = sh(new THREE.Mesh(khandleGeo, metal));
      khandle.position.set(0, 0.022, 0.13);
      knifeG.add(blade, khandle);
    }
    knifeG.rotation.y = 0.04;
    master.add(knifeG);
    entranceGroups.push(knifeG);

    /* ── FİNCAN + TABAĞI ── */
    const cupG = new THREE.Group();
    cupG.position.set(1.35, 0, 0.95);
    {
      const saucerGeo = new THREE.CylinderGeometry(0.3, 0.24, 0.035, 40);
      const cupGeo = new THREE.CylinderGeometry(0.17, 0.13, 0.2, 40);
      const coffeeGeo = new THREE.CylinderGeometry(0.145, 0.145, 0.012, 32);
      const earGeo = new THREE.TorusGeometry(0.075, 0.018, 10, 28, Math.PI);
      disposables.push(saucerGeo, cupGeo, coffeeGeo, earGeo);

      const saucer = sh(new THREE.Mesh(saucerGeo, porcelain));
      saucer.position.y = 0.018;
      const cup = sh(new THREE.Mesh(cupGeo, porcelain));
      cup.position.y = 0.135;
      const coffeeMat = new THREE.MeshStandardMaterial({ color: 0x33241a, roughness: 0.25 });
      disposables.push(coffeeMat);
      const coffee = new THREE.Mesh(coffeeGeo, coffeeMat);
      coffee.position.y = 0.232;
      const ear = sh(new THREE.Mesh(earGeo, porcelain));
      ear.position.set(0.17, 0.14, 0);
      ear.rotation.z = -Math.PI / 2;
      cupG.add(saucer, cup, coffee, ear);
    }
    master.add(cupG);
    entranceGroups.push(cupG);

    /* ── QR STANDI (sahnenin yıldızı) ── */
    const STAND_POS = new THREE.Vector3(0.55, 0, -1.0);
    const PLAQUE_TILT = -0.14; // hafif geriye yaslı
    const standG = new THREE.Group();
    standG.position.copy(STAND_POS);
    standG.rotation.y = -0.12;
    {
      // kırmızı taban
      const footGeo = new THREE.BoxGeometry(0.62, 0.09, 0.34);
      disposables.push(footGeo);
      const foot = sh(new THREE.Mesh(footGeo, red));
      foot.position.y = 0.045;
      standG.add(foot);

      // porselen plaket
      const plaqueShape = roundedRectShape(1.5, 1.5, 0.16);
      const plaqueGeo = new THREE.ExtrudeGeometry(plaqueShape, {
        depth: 0.05,
        bevelEnabled: true,
        bevelThickness: 0.015,
        bevelSize: 0.015,
        bevelSegments: 2,
        curveSegments: 8,
      });
      disposables.push(plaqueGeo);
      const plaque = sh(new THREE.Mesh(plaqueGeo, porcelain));
      plaque.position.set(0, 0.84, 0);
      plaque.rotation.x = PLAQUE_TILT;
      standG.add(plaque);
    }
    master.add(standG);
    entranceGroups.push(standG);

    /* ── QR MODÜLLERİ (plaket önyüzünde) ── */
    const span = 1.16;
    const cell = span / N;
    const modGeo = new THREE.BoxGeometry(cell * 0.85, cell * 0.85, 0.035);
    const modMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0.05,
    });
    disposables.push(modGeo, modMat);

    type Mod = { x: number; y: number; delay: number };
    const mods: Mod[] = [];
    let maxDelay = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (QR_GRID[r][c] !== 1) continue;
        const x = (c - (N - 1) / 2) * cell;
        const y = ((N - 1) / 2 - r) * cell;
        const delay = Math.hypot(x, y) / (span * 0.72);
        maxDelay = Math.max(maxDelay, delay);
        mods.push({ x, y, delay });
      }
    }

    const inst = new THREE.InstancedMesh(modGeo, modMat, mods.length);
    inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    if (!mob) inst.castShadow = true;
    const inkColor = new THREE.Color(0x221d19);
    const redColor = new THREE.Color(0xdc2626);
    let mi = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (QR_GRID[r][c] !== 1) continue;
        inst.setColorAt(mi, isFinder(r, c) ? redColor : inkColor);
        mi++;
      }
    }
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;

    // modüller plaketle aynı düzlemde dursun diye plaketin child grubuna koy
    const qrPlane = new THREE.Group();
    qrPlane.position.set(0, 0.84, 0.085); // plaket önyüzünün hemen önü
    qrPlane.rotation.x = PLAQUE_TILT;
    qrPlane.add(inst);
    standG.add(qrPlane);

    const dummy = new THREE.Object3D();

    /* ── TOZ ZERRELERİ (ışıkta süzülür) ── */
    const nP = mob ? 10 : 24;
    const pArr = new Float32Array(nP * 3);
    for (let i = 0; i < nP; i++) {
      pArr[i * 3] = (Math.random() - 0.5) * 6;
      pArr[i * 3 + 1] = 0.4 + Math.random() * 3;
      pArr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.Float32BufferAttribute(pArr, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.035,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
      depthWrite: false,
    });
    disposables.push(pGeo, pMat);
    scene.add(new THREE.Points(pGeo, pMat));

    /* ── KAMERA YOLU (kuşbakışı → dalış → kod tam ekran) ── */
    const posCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 8.6, 0.8),    // kuşbakışı
      new THREE.Vector3(1.8, 5.4, 4.4),    // süzülme
      new THREE.Vector3(1.3, 2.5, 2.8),    // alçalma
      new THREE.Vector3(0.8, 1.6, 1.4),    // standa yaklaşma
      new THREE.Vector3(0.55, 1.12, 0.82), // kod kadrajı doldurur
    ]);
    const lookCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.1, 0.1, -0.2),
      new THREE.Vector3(0.4, 0.6, -0.85),
      new THREE.Vector3(0.55, 0.84, -1.0),
      new THREE.Vector3(0.55, 0.86, -1.02),
    ]);
    const camPos = new THREE.Vector3();
    const camLook = new THREE.Vector3();

    /* ── AÇILIŞ: objeler masaya gelir, QR dalga halinde dizilir ── */
    const loadP = { v: prefersReduced ? 1 : 0 };
    if (!prefersReduced) {
      entranceGroups.forEach((g, i) => {
        g.scale.setScalar(0.001);
        gsap.to(g.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.75,
          ease: 'back.out(1.5)',
          delay: 0.35 + i * 0.12,
        });
      });
      gsap.to(loadP, { v: 1, duration: 1.7, ease: 'power1.inOut', delay: 0.9 });
    }

    /* ── MOUSE PARALLAX (sadece kuşbakışındayken etkili) ── */
    const mouse = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    if (!prefersReduced) window.addEventListener('pointermove', onPointer);

    const onResize = () => {
      if (!boxRef.current) return;
      const nw = boxRef.current.clientWidth;
      const nh = boxRef.current.clientHeight;
      cam.aspect = nw / nh;
      cam.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    /* ════════ LOOP ════════ */
    let raf = 0;
    const smooth = { v: 0 };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const t = performance.now() * 0.001;

      const target = THREE.MathUtils.clamp(progressRef?.current ?? 0, 0, 1);
      smooth.v += (target - smooth.v) * 0.085;
      const p = smooth.v;

      /* QR dalga pop (açılış) */
      const lp = loadP.v;
      for (let i = 0; i < mods.length; i++) {
        const m = mods[i];
        const local = THREE.MathUtils.clamp((lp * (1 + maxDelay) - m.delay) / 0.45, 0, 1);
        const s = local <= 0 ? 0.0001 : Math.max(0.0001, easeOutBack(local));
        dummy.position.set(m.x, m.y, 0);
        dummy.scale.set(s, s, Math.max(s, 0.0001));
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
      }
      inst.instanceMatrix.needsUpdate = true;

      /* Kompozisyon: kuşbakışında masa sağda durur, dalışta merkeze gelir */
      master.position.x = mob ? 0 : THREE.MathUtils.lerp(1.45, 0, Math.min(1, p * 1.8));

      /* Kamera yolu */
      posCurve.getPoint(p, camPos);
      lookCurve.getPoint(p, camLook);

      if (!prefersReduced) {
        /* Kuşbakışında nefes + mouse parallax; dalış başlayınca söner */
        const calm = Math.max(0, 1 - p * 3.2);
        camPos.x += (Math.sin(t * 0.3) * 0.12 + mouse.x * 0.35) * calm;
        camPos.z += (Math.cos(t * 0.24) * 0.1 + mouse.y * 0.25) * calm;

        /* toz zerreleri yavaşça yükselir */
        for (let i = 0; i < nP; i++) {
          pArr[i * 3 + 1] += 0.0016;
          if (pArr[i * 3 + 1] > 3.4) pArr[i * 3 + 1] = 0.3;
        }
        (pGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      }

      cam.position.copy(camPos);
      cam.lookAt(camLook);

      renderer.render(scene, cam);
    };
    loop();

    /* ── CLEANUP ── */
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      gsap.killTweensOf(loadP);
      entranceGroups.forEach((g) => gsap.killTweensOf(g.scale));
      inst.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    };
  }, [ok, mob, progressRef]);

  /* ── FALLBACK ── */
  if (!ok) {
    return (
      <div className="w-full h-full min-h-[420px] flex flex-col items-center justify-center bg-stone-100/40 p-6 text-center">
        <span className="text-xs text-red-600 font-bold tracking-widest uppercase">3D Deneyim</span>
        <p className="text-xs text-stone-500 mt-2 leading-relaxed max-w-xs">
          3D sahne için WebGL desteği gereklidir. Lütfen modern bir tarayıcı kullanın.
        </p>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="w-full h-full relative select-none">
      <canvas ref={cvRef} className="w-full h-full max-w-full" />
    </div>
  );
}
