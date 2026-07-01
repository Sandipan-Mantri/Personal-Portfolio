// --- THREE.JS INTERACTIVE 3D BACKGROUND ---

let scene, camera, renderer, particleSystem;
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
let scrollPercent = 0;
let cachedScrollHeight = 0;
let cachedWindowHeight = 0;
let animationFrameId = null;
const lookAtTarget = { x: 0, y: 0, z: 0 }; // Pre-allocated to avoid GC pressure

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
const isMobileDevice = window.matchMedia('(pointer: coarse), (max-width: 1024px)').matches || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const isSlowNetwork = connection && /2g|slow-2g/.test(connection.effectiveType || '');
const lowDeviceMemory = navigator.deviceMemory && navigator.deviceMemory <= 2;
const isPerformanceConstrained = isMobileDevice || prefersReducedMotion || isSlowNetwork || lowDeviceMemory;
const desiredPixelRatio = Math.min(window.devicePixelRatio || 1, isPerformanceConstrained ? 1 : 1.5);

function updateWindowDimensions() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;
}

// Generate glowing circular texture for particles using HTML5 canvas (no external image needed)
function createParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(0, 242, 254, 0.8)');
  gradient.addColorStop(0.5, 'rgba(157, 78, 221, 0.4)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 16, 16);

  return new THREE.CanvasTexture(canvas);
}

function initThree() {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030308, 0.012);

  // Camera
  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 150;

  // Particles Geometry
  const particleCount = isMobileDevice ? 650 : 1200;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  const colorCyan = new THREE.Color(0x00f2fe);
  const colorPurple = new THREE.Color(0x9d4edd);
  const colorWhite = new THREE.Color(0xffffff);

  for (let i = 0; i < particleCount * 3; i += 3) {
    // Spatial coordinates inside a sphere-like cloud
    const radius = 220;
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = radius * Math.cbrt(Math.random());

    positions[i] = r * Math.sin(phi) * Math.cos(theta);
    positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i + 2] = r * Math.cos(phi);

    // Dynamic gradient color distribution
    const mixRatio = Math.random();
    let mixedColor;
    if (mixRatio < 0.35) {
      mixedColor = colorCyan.clone().lerp(colorWhite, Math.random() * 0.4);
    } else if (mixRatio < 0.75) {
      mixedColor = colorPurple.clone().lerp(colorWhite, Math.random() * 0.35);
    } else {
      mixedColor = colorCyan.clone().lerp(colorPurple, Math.random() * 0.6);
    }

    colors[i] = mixedColor.r;
    colors[i + 1] = mixedColor.g;
    colors[i + 2] = mixedColor.b;

    // Varying particle sizes
    sizes[i / 3] = Math.random() * 3 + 0.5;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Particle Material
  const material = new THREE.PointsMaterial({
    size: 2.5,
    map: createParticleTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });

  // Points
  particleSystem = new THREE.Points(geometry, material);
  scene.add(particleSystem);

  // WebGL Renderer
  renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(desiredPixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(scene.fog.color, 1);
  container.appendChild(renderer.domElement);

  // Event Listeners
  if (!isPerformanceConstrained) {
    document.addEventListener('mousemove', onDocumentMouseMove);
  }
  window.addEventListener('resize', onWindowResize);

  // Initial caching of heights and scroll listener setup
  updateScrollDimensions();
  window.addEventListener('scroll', onDocumentScroll, { passive: true });

  // Pause render when tab is hidden and restart when visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    } else if (!animationFrameId) {
      animate();
    }
  });

  // Start animation loop only if the page is visible
  if (!document.hidden) {
    animate();
  }
}

function updateScrollDimensions() {
  cachedScrollHeight = document.documentElement.scrollHeight;
  cachedWindowHeight = window.innerHeight;
  scrollPercent = window.scrollY / (cachedScrollHeight - cachedWindowHeight || 1);
}

function onDocumentScroll() {
  scrollPercent = window.scrollY / (cachedScrollHeight - cachedWindowHeight || 1);
}

function onWindowResize() {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  updateWindowDimensions();
  updateScrollDimensions();
}

function onDocumentMouseMove(event) {
  if (isMobileDevice) return;
  // Normalize coordinates (-1 to 1)
  mouseX = (event.clientX - windowHalfX) / 100;
  mouseY = (event.clientY - windowHalfY) / 100;
}

// Animation loop
function animate() {
  animationFrameId = requestAnimationFrame(animate);

  // Smooth mouse interpolation (easing)
  targetX += (mouseX - targetX) * 0.08;
  targetY += (mouseY - targetY) * 0.08;

  // Enhanced rotation + mouse interaction with wobble effect
  if (particleSystem) {
    const time = Date.now();
    const rotationSpeed = isPerformanceConstrained ? 0.00004 : 0.0001;
    const rotationSpeedAlt = isPerformanceConstrained ? 0.00002 : 0.00006;
    const wobbleSpeed = isPerformanceConstrained ? 0.00001 : 0.00003;
    const pulseSpeed = isPerformanceConstrained ? 0.00035 : 0.0005;

    particleSystem.rotation.y = time * rotationSpeed + (targetX * 0.12);
    particleSystem.rotation.x = time * rotationSpeedAlt + (targetY * 0.12);
    particleSystem.rotation.z = Math.sin(time * wobbleSpeed) * 0.2;

    // Scale pulse effect based on time
    const scale = 1 + Math.sin(time * pulseSpeed) * 0.04;
    particleSystem.scale.set(scale, scale, scale);
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Setup progress loader and init
function startThreeApp() {
  const progressVal = document.getElementById('loader-progress');
  const statusVal = document.getElementById('loader-status');

  if (progressVal) progressVal.style.width = '40%';

  if (isMobileDevice) {
    if (statusVal) statusVal.textContent = 'Mobile device detected. Optimizing background...';
    if (progressVal) progressVal.style.width = '100%';
    return;
  }

  setTimeout(() => {
    if (progressVal) progressVal.style.width = '75%';
    if (statusVal) statusVal.textContent = 'Building Constellations...';
  }, 300);

  setTimeout(() => {
    try {
      initThree();
      if (progressVal) progressVal.style.width = '100%';
      if (statusVal) statusVal.textContent = 'Ready!';
    } catch (e) {
      console.error("Three.js initialization failed: ", e);
      if (statusVal) statusVal.textContent = 'Hardware Acceleration Unavailable. Loading fallback...';
    }
  }, 600);
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', startThreeApp);
} else {
  startThreeApp();
}
