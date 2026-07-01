// --- THREE.JS INTERACTIVE 3D BACKGROUND ---

let scene, camera, renderer, particleSystem;
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

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
  const particleCount = 2500;
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
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(scene.fog.color, 1);
  container.appendChild(renderer.domElement);

  // Event Listeners
  document.addEventListener('mousemove', onDocumentMouseMove);
  window.addEventListener('resize', onWindowResize);

  // Start animation loop
  animate();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
  // Normalize coordinates (-1 to 1)
  mouseX = (event.clientX - windowHalfX) / 100;
  mouseY = (event.clientY - windowHalfY) / 100;
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Smooth mouse interpolation (easing)
  targetX += (mouseX - targetX) * 0.08;
  targetY += (mouseY - targetY) * 0.08;

  // Enhanced rotation + mouse interaction with wobble effect
  if (particleSystem) {
    const time = Date.now();
    particleSystem.rotation.y = time * 0.0001 + (targetX * 0.15);
    particleSystem.rotation.x = time * 0.00006 + (targetY * 0.15);
    particleSystem.rotation.z = Math.sin(time * 0.00003) * 0.3;

    // Scale pulse effect based on time
    const scale = 1 + Math.sin(time * 0.0005) * 0.08;
    particleSystem.scale.set(scale, scale, scale);
  }

  // Scroll responsive camera motion with enhanced depth
  const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1);

  // Transition camera depth and tilt depending on scroll
  camera.position.z = 130 + Math.sin(scrollPercent * Math.PI) * 60;
  camera.position.y = -scrollPercent * 80;
  camera.position.x = Math.sin(scrollPercent * Math.PI) * 30;
  camera.lookAt(new THREE.Vector3(Math.sin(scrollPercent * Math.PI) * 20, -scrollPercent * 50, 0));
  window.addEventListener('DOMContentLoaded', () => {
    // Update progress bar during loading
    const progressVal = document.getElementById('loader-progress');
    const statusVal = document.getElementById('loader-status');

    if (progressVal) progressVal.style.width = '40%';

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
  });
