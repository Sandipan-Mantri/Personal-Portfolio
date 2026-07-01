// --- THREE.JS PREMIUM HIGH-GRAPHICS COSMIC + 3D CYBER GRID BACKGROUND ---
// Features: Dual-layer particles, dynamic constellation lines, 3D cyber grid terrain, mouse warp.
// Optimized with screen-size adaptive scaling for consistent 60fps performance.

(function () {
  'use strict';

  let scene, camera, renderer;
  let starsGeometry, starsPoints;
  let nebulaGeometry, nebulaPoints;
  let lineSegments;
  let gridLines; // Cyber grid mesh

  // Configuration settings (scaled dynamically based on resolution)
  const CFG = {
    dustCount: window.innerWidth < 768 ? 800 : 2000,
    starCount: window.innerWidth < 768 ? 80 : 180,
    lineMaxDist: window.innerWidth < 768 ? 40 : 60,
    maxConnections: 3,
    springStrength: 0.04,
    mouseRadius: 150,
    mouseStrength: 0.5,
    // Cyber Grid
    gridWidth: 500,
    gridDepth: 400,
    gridSegX: window.innerWidth < 768 ? 16 : 32,
    gridSegY: window.innerWidth < 768 ? 12 : 24,
    gridY: -70,
  };

  // State
  let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let scrollInfo = { current: 0, target: 0, ease: 0.05 };
  let stars = [];
  let gridPoints = []; // Base coordinates for grid vertices warping

  // Generate glowing circular texture for stars/nebula
  function createGlowTexture(colorStr, baseSize = 32) {
    const canvas = document.createElement('canvas');
    canvas.width = baseSize;
    canvas.height = baseSize;
    const ctx = canvas.getContext('2d');
    const half = baseSize / 2;

    const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.2, colorStr);
    grad.addColorStop(0.5, 'rgba(15, 8, 28, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, baseSize, baseSize);

    return new THREE.CanvasTexture(canvas);
  }

  // Build the custom 3D wireframe cyber grid
  function buildCyberGrid() {
    const segmentsX = CFG.gridSegX;
    const segmentsY = CFG.gridSegY;
    const halfW = CFG.gridWidth / 2;
    const halfD = CFG.gridDepth / 2;

    const vertices = [];
    const colors = [];

    // Helper to calculate vertex index in loop
    gridPoints = [];

    // Generate coordinates grid
    for (let y = 0; y <= segmentsY; y++) {
      const pZ = (y / segmentsY) * CFG.gridDepth - halfD;
      for (let x = 0; x <= segmentsX; x++) {
        const pX = (x / segmentsX) * CFG.gridWidth - halfW;
        gridPoints.push({
          x: pX,
          y: CFG.gridY,
          z: pZ,
          origY: CFG.gridY,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    // Build segments index mapping
    const getIndex = (x, y) => y * (segmentsX + 1) + x;

    // Create lines geometry
    for (let y = 0; y <= segmentsY; y++) {
      for (let x = 0; x <= segmentsX; x++) {
        const idx = getIndex(x, y);

        // Horizontal line
        if (x < segmentsX) {
          const nextIdx = getIndex(x + 1, y);
          vertices.push(gridPoints[idx], gridPoints[nextIdx]);
        }
        // Vertical line
        if (y < segmentsY) {
          const nextIdx = getIndex(x, y + 1);
          vertices.push(gridPoints[idx], gridPoints[nextIdx]);
        }
      }
    }

    const flatVertices = new Float32Array(vertices.length * 3);
    const flatColors = new Float32Array(vertices.length * 3);

    const cCyan = new THREE.Color(0x00f2fe);
    const cPurple = new THREE.Color(0x9d4edd);

    // Populate positions and fade color based on depth
    for (let i = 0; i < vertices.length; i++) {
      const v = vertices[i];
      flatVertices[i * 3] = v.x;
      flatVertices[i * 3 + 1] = v.y;
      flatVertices[i * 3 + 2] = v.z;

      // Color fade out into depth (Z coordinate)
      const depthRatio = (v.z + halfD) / CFG.gridDepth; // 0 (back) to 1 (front)
      const col = cCyan.clone().lerp(cPurple, 1.0 - depthRatio);
      const intensity = depthRatio * depthRatio * 0.18; // soft glow

      flatColors[i * 3] = col.r * intensity;
      flatColors[i * 3 + 1] = col.g * intensity;
      flatColors[i * 3 + 2] = col.b * intensity;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(flatVertices, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(flatColors, 3));

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    gridLines = new THREE.LineSegments(geom, mat);
    scene.add(gridLines);
  }

  function updateCyberGrid(time, scrollFrac) {
    if (!gridLines) return;

    const positions = gridLines.geometry.attributes.position.array;
    const segmentsX = CFG.gridSegX;
    const segmentsY = CFG.gridSegY;
    const halfW = CFG.gridWidth / 2;
    const halfD = CFG.gridDepth / 2;

    // Helper map
    const getIndex = (x, y) => y * (segmentsX + 1) + x;

    // Calculate wave displacement for each vertex
    const computedHeights = new Float32Array(gridPoints.length);
    const waveSpeed = time * 2.5;
    const scrollFactor = 1.0 + scrollFrac * 1.5;

    for (let i = 0; i < gridPoints.length; i++) {
      const p = gridPoints[i];
      // Wave math based on grid index position
      const waveX = Math.sin(p.x * 0.02 + waveSpeed) * 8.0;
      const waveZ = Math.cos(p.z * 0.015 + waveSpeed) * 8.0;
      
      // Mouse coordinate grid warping proximity
      const dx = (mouse.x * 1.2) - p.x;
      const dz = (mouse.y * 1.2) - (p.z + camera.position.z - 180);
      const dist = Math.sqrt(dx * dx + dz * dz);
      let localDisplacement = 0;
      if (dist < 180) {
        localDisplacement = (1.0 - dist / 180) * 16.0 * Math.sin(waveSpeed - dist * 0.04);
      }

      computedHeights[i] = p.origY + (waveX + waveZ) * scrollFactor + localDisplacement;
    }

    // Map calculated heights back into the line segments buffer array
    let ptr = 0;
    for (let y = 0; y <= segmentsY; y++) {
      for (let x = 0; x <= segmentsX; x++) {
        const idx = getIndex(x, y);
        const h = computedHeights[idx];

        if (x < segmentsX) {
          const nextIdx = getIndex(x + 1, y);
          const nextH = computedHeights[nextIdx];

          positions[ptr + 1] = h;
          positions[ptr + 4] = nextH;
          ptr += 6;
        }

        if (y < segmentsY) {
          const nextIdx = getIndex(x, y + 1);
          const nextH = computedHeights[nextIdx];

          positions[ptr + 1] = h;
          positions[ptr + 4] = nextH;
          ptr += 6;
        }
      }
    }

    gridLines.geometry.attributes.position.needsUpdate = true;
  }

  function initThreeBg() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // 1. SCENE & CAMERA
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030308, 0.0075);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 180;

    // 2. LAYER 1: NEBULA DUST
    nebulaGeometry = new THREE.BufferGeometry();
    const dustCoords = new Float32Array(CFG.dustCount * 3);
    const dustColors = new Float32Array(CFG.dustCount * 3);
    const cCyan = new THREE.Color(0x00f2fe);
    const cPurple = new THREE.Color(0x9d4edd);
    const cWhite = new THREE.Color(0xffffff);

    for (let i = 0; i < CFG.dustCount * 3; i += 3) {
      const radius = 260 * Math.sqrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * 0.4;

      dustCoords[i] = radius * Math.cos(theta);
      dustCoords[i + 1] = radius * Math.sin(phi) + 10;
      dustCoords[i + 2] = radius * Math.sin(theta) + (Math.random() - 0.5) * 40;

      const mix = Math.random();
      let col;
      if (mix < 0.45) {
        col = cCyan.clone().lerp(cWhite, Math.random() * 0.25);
      } else if (mix < 0.85) {
        col = cPurple.clone().lerp(cWhite, Math.random() * 0.25);
      } else {
        col = cCyan.clone().lerp(cPurple, Math.random() * 0.5);
      }

      dustColors[i] = col.r;
      dustColors[i + 1] = col.g;
      dustColors[i + 2] = col.b;
    }

    nebulaGeometry.setAttribute('position', new THREE.BufferAttribute(dustCoords, 3));
    nebulaGeometry.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

    const nebulaMat = new THREE.PointsMaterial({
      size: 1.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: createGlowTexture('rgba(157, 78, 221, 0.7)', 16),
    });

    nebulaPoints = new THREE.Points(nebulaGeometry, nebulaMat);
    scene.add(nebulaPoints);

    // 3. LAYER 2: INTERACTIVE STAR NODES
    starsGeometry = new THREE.BufferGeometry();
    const starCoords = new Float32Array(CFG.starCount * 3);
    const starColors = new Float32Array(CFG.starCount * 3);

    for (let i = 0; i < CFG.starCount; i++) {
      const x = (Math.random() - 0.5) * 300;
      const y = (Math.random() - 0.5) * 200 + 15;
      const z = (Math.random() - 0.5) * 140;

      starCoords[i * 3] = x;
      starCoords[i * 3 + 1] = y;
      starCoords[i * 3 + 2] = z;

      stars.push({
        x: x, y: y, z: z,
        baseX: x, baseY: y, baseZ: z,
        vx: 0, vy: 0, vz: 0,
        speedOffset: Math.random() * 100,
        color: Math.random() < 0.65 ? cCyan : cPurple
      });

      const col = stars[i].color;
      starColors[i * 3] = col.r;
      starColors[i * 3 + 1] = col.g;
      starColors[i * 3 + 2] = col.b;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starCoords, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starsMat = new THREE.PointsMaterial({
      size: 3.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: createGlowTexture('rgba(0, 242, 254, 0.8)', 32),
    });

    starsPoints = new THREE.Points(starsGeometry, starsMat);
    scene.add(starsPoints);

    // 4. CONNECTING CONSTELLATION LINES
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const lineGeometry = new THREE.BufferGeometry();
    const maxLineCount = CFG.starCount * CFG.maxConnections;
    const linePositions = new Float32Array(maxLineCount * 2 * 3);
    const lineColors = new Float32Array(maxLineCount * 2 * 3);

    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    lineSegments = new THREE.LineSegments(lineGeometry, lineMat);
    scene.add(lineSegments);

    // 5. LAYER 3: 3D CYBER DIGITAL GRID
    buildCyberGrid();

    // 6. WebGL RENDERER
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(scene.fog.color, 1);
    container.appendChild(renderer.domElement);

    // Listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);

    animate();
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onMouseMove(event) {
    mouse.targetX = (event.clientX - window.innerWidth / 2);
    mouse.targetY = -(event.clientY - window.innerHeight / 2);
  }

  function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.0006;

    // Mouse interpolation
    mouse.x += (mouse.targetX - mouse.x) * 0.08;
    mouse.y += (mouse.targetY - mouse.y) * 0.08;

    // Scroll interpolation
    scrollInfo.current += (scrollInfo.target - scrollInfo.current) * scrollInfo.ease;

    // 1. UPDATE CYBER GRID
    updateCyberGrid(time, scrollInfo.current);

    // 2. UPDATE STARS PHYSICS
    const positions = starsPoints.geometry.attributes.position.array;
    const mouse3D = new THREE.Vector3(mouse.x * 0.4, mouse.y * 0.4, 0);

    for (let i = 0; i < CFG.starCount; i++) {
      const star = stars[i];

      const floatX = Math.sin(time + star.speedOffset) * 0.12;
      const floatY = Math.cos(time * 0.85 + star.speedOffset) * 0.12;
      star.baseX += floatX;
      star.baseY += floatY;

      const dx = mouse3D.x - star.x;
      const dy = mouse3D.y - star.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CFG.mouseRadius) {
        const force = (1.0 - dist / CFG.mouseRadius) * CFG.mouseStrength;
        star.vx += dx * force * 0.005;
        star.vy += dy * force * 0.005;
      }

      const ax = (star.baseX - star.x) * CFG.springStrength;
      const ay = (star.baseY - star.y) * CFG.springStrength;
      const az = (star.baseZ - star.z) * CFG.springStrength;

      star.vx += ax;
      star.vy += ay;
      star.vz += az;

      star.vx *= 0.88;
      star.vy *= 0.88;
      star.vz *= 0.88;

      star.x += star.vx;
      star.y += star.vy;
      star.z += star.vz;

      positions[i * 3] = star.x;
      positions[i * 3 + 1] = star.y;
      positions[i * 3 + 2] = star.z;
    }
    starsPoints.geometry.attributes.position.needsUpdate = true;

    // 3. UPDATE CONSTELLATION CONNECTIONS
    const linePosAttr = lineSegments.geometry.attributes.position;
    const lineColAttr = lineSegments.geometry.attributes.color;
    const linePos = linePosAttr.array;
    const lineCol = lineColAttr.array;
    let lineIdx = 0;

    const connectionCount = new Uint8Array(CFG.starCount);

    for (let i = 0; i < CFG.starCount; i++) {
      if (connectionCount[i] >= CFG.maxConnections) continue;
      const starA = stars[i];

      for (let j = i + 1; j < CFG.starCount; j++) {
        if (connectionCount[i] >= CFG.maxConnections) break;
        if (connectionCount[j] >= CFG.maxConnections) continue;

        const starB = stars[j];
        const dx = starA.x - starB.x;
        const dy = starA.y - starB.y;
        const dz = starA.z - starB.z;
        const dSq = dx * dx + dy * dy + dz * dz;

        if (dSq < CFG.lineMaxDist * CFG.lineMaxDist) {
          const dist = Math.sqrt(dSq);
          const opacity = 1.0 - (dist / CFG.lineMaxDist);

          linePos[lineIdx] = starA.x;
          linePos[lineIdx + 1] = starA.y;
          linePos[lineIdx + 2] = starA.z;

          linePos[lineIdx + 3] = starB.x;
          linePos[lineIdx + 4] = starB.y;
          linePos[lineIdx + 5] = starB.z;

          const colorCyan = new THREE.Color(0x00f2fe);
          const col = colorCyan.multiplyScalar(opacity * 0.22);

          lineCol[lineIdx] = col.r;
          lineCol[lineIdx + 1] = col.g;
          lineCol[lineIdx + 2] = col.b;

          lineCol[lineIdx + 3] = col.r;
          lineCol[lineIdx + 4] = col.g;
          lineCol[lineIdx + 5] = col.b;

          lineIdx += 6;
          connectionCount[i]++;
          connectionCount[j]++;
        }
      }
    }

    const maxAllocated = CFG.starCount * CFG.maxConnections * 2 * 3;
    for (let k = lineIdx; k < maxAllocated; k++) {
      linePos[k] = 0;
      lineCol[k] = 0;
    }

    linePosAttr.needsUpdate = true;
    lineColAttr.needsUpdate = true;
    lineSegments.geometry.setDrawRange(0, lineIdx / 3);

    // 4. BACKDROP DUST ROTATION
    if (nebulaPoints) {
      nebulaPoints.rotation.y = time * 0.035;
      nebulaPoints.rotation.x = time * 0.012;
    }

    // 5. PARALLAX CAMERA CONTROL
    const targetCamZ = 170 + Math.sin(scrollInfo.current * Math.PI) * 40;
    const targetCamY = -scrollInfo.current * 65;
    const targetCamX = Math.sin(scrollInfo.current * Math.PI) * 15;

    camera.position.z += (targetCamZ - camera.position.z) * 0.08;
    camera.position.y += (targetCamY - camera.position.y) * 0.08;
    camera.position.x += (targetCamX - camera.position.x) * 0.08;
    camera.lookAt(new THREE.Vector3(camera.position.x * 0.4, camera.position.y * 0.85, 0));

    renderer.render(scene, camera);
  }

  // Bind scroll tracker
  window.addEventListener('scroll', () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollInfo.target = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  });

  // Boot on document ready
  window.addEventListener('DOMContentLoaded', () => {
    const progressVal = document.getElementById('loader-progress');
    const statusVal = document.getElementById('loader-status');

    if (progressVal) progressVal.style.width = '40%';

    setTimeout(() => {
      if (progressVal) progressVal.style.width = '75%';
      if (statusVal) statusVal.textContent = 'Mapping Digital Landscape...';
    }, 200);

    setTimeout(() => {
      try {
        initThreeBg();
        if (progressVal) progressVal.style.width = '100%';
        if (statusVal) statusVal.textContent = 'Ready!';
      } catch (err) {
        console.error("Three.js background initialization failed: ", err);
        if (statusVal) statusVal.textContent = 'Hardware Acceleration Unavailable.';
      }
    }, 500);
  });

})();
