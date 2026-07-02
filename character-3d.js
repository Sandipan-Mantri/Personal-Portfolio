// --- PROCEDURAL 3D REALISTIC HUMAN CHARACTER ---
// Renders a stylized-realistic male figure using Three.js geometry primitives.
// Matches Sandipan's look: dark wavy hair, dark shirt, slim build.
// Animations: idle, walk, run, sit, wave (on hover) — driven by scroll velocity & cursor tracking.

(function () {
  'use strict';

  const CFG = {
    canvasWidth: 100,
    canvasHeight: 140,
    cameraFov: 28,
    cameraDist: 5.6,
    cameraY: 0.7,
    // Appearance
    skinColor: 0xc8956e,
    skinDark: 0xb07a58,
    hairColor: 0x0e0804,
    shirtColor: 0x00f2fe,
    pantsColor: 0x9d4edd,
    shoeColor: 0x111111,
    beltColor: 0x111111,
    eyeWhite: 0xf0ece6,
    eyeIris: 0x2a1a0e,
    eyePupil: 0x050503,
    lipColor: 0x9e6b5a,
    // Animation
    walkSpeed: 3.2,
    runSpeed: 7.5,
    idleSpeed: 1.0,
    walkThreshold: 2,
    runThreshold: 280,
    sitThreshold: 0.95,
    fadeDuration: 0.22,
  };

  let scene, camera, renderer, clock;
  let ch = {};
  let rootGroup;
  
  // Animation state
  let animState = 'idle';
  let animTime = 0;
  let blendFactor = 0;
  let prevPose = null;
  
  // Input tracking
  let lastScrollY = 0;
  let lastScrollTime = performance.now();
  let scrollVelocity = 0;
  let idleTimer = 0;
  let isHovered = false;

  // Normalized mouse coordinates (-1 to 1) for head look-at tracking
  let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  function mat(color, opts) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: opts?.roughness ?? 0.72,
      metalness: opts?.metalness ?? 0.03,
      flatShading: false,
      ...opts,
    });
  }

  // ── Build Realistic Human ──
  function buildCharacter() {
    rootGroup = new THREE.Group();
    rootGroup.position.set(0, -1.35, 0);

    // ── HIP (root bone) ──
    const hip = new THREE.Group();
    hip.position.set(0, 1.0, 0);
    rootGroup.add(hip);

    // Belt
    const beltGeo = new THREE.TorusGeometry(0.21, 0.015, 8, 24);
    const beltMesh = new THREE.Mesh(beltGeo, mat(CFG.beltColor, { roughness: 0.55 }));
    beltMesh.position.set(0, 0.0, 0);
    beltMesh.rotation.x = Math.PI * 0.5;
    hip.add(beltMesh);

    // ── SPINE ──
    const spine = new THREE.Group();
    spine.position.set(0, 0, 0);
    hip.add(spine);

    // Torso
    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.21, 0.55, 12);
    const torsoMesh = new THREE.Mesh(torsoGeo, mat(CFG.shirtColor, { roughness: 0.92 }));
    torsoMesh.position.set(0, 0.28, 0);
    spine.add(torsoMesh);

    // Shoulders
    const shoulderGeo = new THREE.SphereGeometry(0.26, 12, 8);
    const shoulderMesh = new THREE.Mesh(shoulderGeo, mat(CFG.shirtColor, { roughness: 0.92 }));
    shoulderMesh.position.set(0, 0.5, 0);
    shoulderMesh.scale.set(1.1, 0.35, 0.85);
    spine.add(shoulderMesh);

    // Collar
    const collarGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.05, 12);
    const collarMesh = new THREE.Mesh(collarGeo, mat(CFG.shirtColor, { roughness: 0.88 }));
    collarMesh.position.set(0, 0.56, 0);
    spine.add(collarMesh);

    // Buttons
    for (let i = 0; i < 4; i++) {
      const btnGeo = new THREE.SphereGeometry(0.01, 6, 4);
      const btn = new THREE.Mesh(btnGeo, mat(0x222222));
      btn.position.set(0, 0.15 + i * 0.1, 0.21);
      spine.add(btn);
    }

    // ── NECK ──
    const neckGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.1, 10);
    const neckMesh = new THREE.Mesh(neckGeo, mat(CFG.skinColor, { roughness: 0.5 }));
    neckMesh.position.set(0, 0.62, 0);
    spine.add(neckMesh);

    // ── HEAD ──
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.78, 0);
    spine.add(headGroup);

    // Head sphere
    const headGeo = new THREE.SphereGeometry(0.165, 16, 14);
    const headMesh = new THREE.Mesh(headGeo, mat(CFG.skinColor, { roughness: 0.48 }));
    headMesh.scale.set(1, 1.05, 0.95);
    headGroup.add(headMesh);

    // Jawline
    const jawGeo = new THREE.SphereGeometry(0.1, 10, 8);
    const jawMesh = new THREE.Mesh(jawGeo, mat(CFG.skinColor, { roughness: 0.5 }));
    jawMesh.position.set(0, -0.1, 0.04);
    jawMesh.scale.set(1, 0.55, 0.8);
    headGroup.add(jawMesh);

    // Nose
    const noseGeo = new THREE.CylinderGeometry(0.012, 0.025, 0.06, 6);
    const noseMesh = new THREE.Mesh(noseGeo, mat(CFG.skinColor, { roughness: 0.45 }));
    noseMesh.position.set(0, -0.02, 0.16);
    noseMesh.rotation.x = -0.3;
    headGroup.add(noseMesh);

    // Nose tip
    const noseTipGeo = new THREE.SphereGeometry(0.02, 6, 4);
    const noseTip = new THREE.Mesh(noseTipGeo, mat(CFG.skinDark, { roughness: 0.4 }));
    noseTip.position.set(0, -0.04, 0.17);
    headGroup.add(noseTip);

    // Eyes
    [-1, 1].forEach(side => {
      const socketGeo = new THREE.SphereGeometry(0.038, 8, 6);
      const socket = new THREE.Mesh(socketGeo, mat(CFG.skinDark, { roughness: 0.55 }));
      socket.position.set(side * 0.058, 0.02, 0.12);
      socket.scale.set(1, 0.75, 0.45);
      headGroup.add(socket);

      const ewGeo = new THREE.SphereGeometry(0.03, 8, 6);
      const ew = new THREE.Mesh(ewGeo, mat(CFG.eyeWhite, { roughness: 0.25 }));
      ew.position.set(side * 0.058, 0.02, 0.135);
      ew.scale.set(0.95, 0.7, 0.45);
      headGroup.add(ew);

      const irisGeo = new THREE.SphereGeometry(0.018, 8, 6);
      const iris = new THREE.Mesh(irisGeo, mat(CFG.eyeIris, { roughness: 0.2 }));
      iris.position.set(side * 0.058, 0.02, 0.15);
      headGroup.add(iris);

      const pupilGeo = new THREE.SphereGeometry(0.01, 6, 4);
      const pupil = new THREE.Mesh(pupilGeo, mat(CFG.eyePupil, { roughness: 0.08 }));
      pupil.position.set(side * 0.058, 0.02, 0.155);
      headGroup.add(pupil);

      const browGeo = new THREE.BoxGeometry(0.05, 0.012, 0.018);
      const brow = new THREE.Mesh(browGeo, mat(CFG.hairColor, { roughness: 0.9 }));
      brow.position.set(side * 0.058, 0.055, 0.135);
      brow.rotation.z = side * -0.12;
      headGroup.add(brow);
    });

    // Mouth & ears
    const mouthGeo = new THREE.BoxGeometry(0.05, 0.007, 0.01);
    const mouth = new THREE.Mesh(mouthGeo, mat(CFG.lipColor, { roughness: 0.35 }));
    mouth.position.set(0, -0.07, 0.15);
    headGroup.add(mouth);

    [-1, 1].forEach(side => {
      const earGeo = new THREE.SphereGeometry(0.035, 8, 6);
      const ear = new THREE.Mesh(earGeo, mat(CFG.skinColor, { roughness: 0.55 }));
      ear.position.set(side * 0.165, 0.0, 0);
      ear.scale.set(0.35, 0.65, 0.5);
      headGroup.add(ear);
    });

    const stubbleGeo = new THREE.SphereGeometry(0.08, 8, 6);
    const stubble = new THREE.Mesh(stubbleGeo, mat(CFG.skinDark, { roughness: 0.75, transparent: true, opacity: 0.25 }));
    stubble.position.set(0, -0.08, 0.08);
    stubble.scale.set(0.8, 0.35, 0.5);
    headGroup.add(stubble);

    // Hair
    const hairMat = mat(CFG.hairColor, { roughness: 0.95 });
    const hairCapGeo = new THREE.SphereGeometry(0.175, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
    hairCap.position.set(0, 0.02, -0.01);
    hairCap.scale.set(1.06, 1.15, 1.06);
    headGroup.add(hairCap);

    const hairSideGeo = new THREE.CylinderGeometry(0.16, 0.14, 0.1, 12, 1, true);
    const hairSide = new THREE.Mesh(hairSideGeo, hairMat);
    hairSide.position.set(0, 0.04, -0.02);
    hairSide.scale.set(1.08, 1, 1.05);
    headGroup.add(hairSide);

    const tufts = [
      { x: 0, y: 0.17, z: 0.05, rx: -0.35, rz: 0, s: 1 },
      { x: 0.06, y: 0.16, z: 0.03, rx: -0.2, rz: 0.35, s: 0.88 },
      { x: -0.07, y: 0.155, z: 0.02, rx: -0.18, rz: -0.4, s: 0.92 },
      { x: 0.04, y: 0.145, z: -0.04, rx: 0.2, rz: 0.25, s: 0.78 },
      { x: -0.03, y: 0.17, z: 0.04, rx: -0.38, rz: -0.12, s: 0.96 },
      { x: 0.09, y: 0.13, z: -0.01, rx: 0.1, rz: 0.5, s: 0.72 },
    ];
    tufts.forEach(t => {
      const tGeo = new THREE.SphereGeometry(0.048 * (t.s || 1), 8, 6);
      const tMesh = new THREE.Mesh(tGeo, hairMat);
      tMesh.position.set(t.x, t.y, t.z);
      tMesh.rotation.set(t.rx || 0, 0, t.rz || 0);
      tMesh.scale.set(1.1, 0.65, 0.85);
      headGroup.add(tMesh);
    });

    const hairBackGeo = new THREE.SphereGeometry(0.14, 10, 8, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.5);
    const hairBack = new THREE.Mesh(hairBackGeo, hairMat);
    hairBack.position.set(0, -0.02, -0.04);
    hairBack.scale.set(1.12, 1, 1.18);
    headGroup.add(hairBack);

    // ── ARMS & LEGS ──
    const leftShoulderGroup = new THREE.Group();
    leftShoulderGroup.position.set(-0.3, 0.5, 0);
    spine.add(leftShoulderGroup);

    const rightShoulderGroup = new THREE.Group();
    rightShoulderGroup.position.set(0.3, 0.5, 0);
    spine.add(rightShoulderGroup);

    const armGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.28, 8);
    const armMat = mat(CFG.shirtColor, { roughness: 0.9 });
    const skinMat = mat(CFG.skinColor, { roughness: 0.5 });
    const forearmGeo = new THREE.CylinderGeometry(0.038, 0.032, 0.24, 8);
    const handGeo = new THREE.SphereGeometry(0.033, 8, 6);

    // Left arm
    const leftUpperArm = new THREE.Group();
    leftUpperArm.position.set(0, -0.05, 0);
    leftShoulderGroup.add(leftUpperArm);
    const lArmMesh = new THREE.Mesh(armGeo, armMat);
    lArmMesh.position.set(0, -0.14, 0);
    leftUpperArm.add(lArmMesh);

    const leftForearm = new THREE.Group();
    leftForearm.position.set(0, -0.28, 0);
    leftUpperArm.add(leftForearm);
    const lForearmMesh = new THREE.Mesh(forearmGeo, skinMat);
    lForearmMesh.position.set(0, -0.12, 0);
    leftForearm.add(lForearmMesh);
    const lHand = new THREE.Mesh(handGeo, skinMat);
    lHand.position.set(0, -0.26, 0);
    leftForearm.add(lHand);

    // Right arm
    const rightUpperArm = new THREE.Group();
    rightUpperArm.position.set(0, -0.05, 0);
    rightShoulderGroup.add(rightUpperArm);
    const rArmMesh = new THREE.Mesh(armGeo, armMat);
    rArmMesh.position.set(0, -0.14, 0);
    rightUpperArm.add(rArmMesh);

    const rightForearm = new THREE.Group();
    rightForearm.position.set(0, -0.28, 0);
    rightUpperArm.add(rightForearm);
    const rForearmMesh = new THREE.Mesh(forearmGeo, skinMat);
    rForearmMesh.position.set(0, -0.12, 0);
    rightForearm.add(rForearmMesh);
    const rHand = new THREE.Mesh(handGeo, skinMat);
    rHand.position.set(0, -0.26, 0);
    rightForearm.add(rHand);

    // Legs
    const leftHipJoint = new THREE.Group();
    leftHipJoint.position.set(-0.09, 0, 0);
    hip.add(leftHipJoint);

    const rightHipJoint = new THREE.Group();
    rightHipJoint.position.set(0.09, 0, 0);
    hip.add(rightHipJoint);

    const upperLegGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.38, 8);
    const pantsMat = mat(CFG.pantsColor, { roughness: 0.85 });
    const lowerLegGeo = new THREE.CylinderGeometry(0.05, 0.042, 0.34, 8);
    const shoeGeo = new THREE.BoxGeometry(0.08, 0.048, 0.14);
    const shoeMat = mat(CFG.shoeColor, { roughness: 0.55, metalness: 0.08 });

    // Left leg
    const leftUpperLeg = new THREE.Group();
    leftHipJoint.add(leftUpperLeg);
    const lULegMesh = new THREE.Mesh(upperLegGeo, pantsMat);
    lULegMesh.position.set(0, -0.19, 0);
    leftUpperLeg.add(lULegMesh);

    const leftKnee = new THREE.Group();
    leftKnee.position.set(0, -0.38, 0);
    leftUpperLeg.add(leftKnee);
    const lLLegMesh = new THREE.Mesh(lowerLegGeo, pantsMat);
    lLLegMesh.position.set(0, -0.17, 0);
    leftKnee.add(lLLegMesh);
    const lShoe = new THREE.Mesh(shoeGeo, shoeMat);
    lShoe.position.set(0, -0.37, 0.02);
    leftKnee.add(lShoe);

    // Right leg
    const rightUpperLeg = new THREE.Group();
    rightHipJoint.add(rightUpperLeg);
    const rULegMesh = new THREE.Mesh(upperLegGeo, pantsMat);
    rULegMesh.position.set(0, -0.19, 0);
    rightUpperLeg.add(rULegMesh);

    const rightKnee = new THREE.Group();
    rightKnee.position.set(0, -0.38, 0);
    rightUpperLeg.add(rightKnee);
    const rLLegMesh = new THREE.Mesh(lowerLegGeo, pantsMat);
    rLLegMesh.position.set(0, -0.17, 0);
    rightKnee.add(rLLegMesh);
    const rShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rShoe.position.set(0, -0.37, 0.02);
    rightKnee.add(rShoe);

    ch = {
      root: rootGroup,
      hip,
      spine,
      headGroup,
      leftUpperArm,
      rightUpperArm,
      leftForearm,
      rightForearm,
      leftHipJoint,
      rightHipJoint,
      leftUpperLeg,
      rightUpperLeg,
      leftKnee,
      rightKnee,
    };

    scene.add(rootGroup);
  }

  // ── Animation Pose Systems ──

  function applyLookAt() {
    // Eased head look at tracking
    ch.headGroup.rotation.y += (mouse.x * 0.42 - ch.headGroup.rotation.y) * 0.1;
    ch.headGroup.rotation.x += (-mouse.y * 0.28 - ch.headGroup.rotation.x) * 0.1;
  }

  function poseIdle(t) {
    const b = Math.sin(t * CFG.idleSpeed) * 0.018;
    const s = Math.sin(t * 0.7) * 0.012;

    ch.spine.rotation.set(b * 0.4, s, 0);
    ch.hip.position.y = 1.0 + b * 0.4;
    
    // Smooth LookAt applied to neck joints
    applyLookAt();

    ch.leftUpperArm.rotation.set(0.04, 0, 0.07);
    ch.rightUpperArm.rotation.set(0.04, 0, -0.07);
    ch.leftForearm.rotation.set(0, 0, 0);
    ch.rightForearm.rotation.set(0, 0, 0);

    ch.leftHipJoint.rotation.set(0, 0, 0);
    ch.rightHipJoint.rotation.set(0, 0, 0);
    ch.leftUpperLeg.rotation.set(0, 0, 0);
    ch.rightUpperLeg.rotation.set(0, 0, 0);
    ch.leftKnee.rotation.set(0, 0, 0);
    ch.rightKnee.rotation.set(0, 0, 0);
  }

  function poseWalk(t) {
    const c = t * CFG.walkSpeed;
    const leg = Math.sin(c) * 0.32;
    const arm = Math.sin(c) * 0.22;
    const bounce = Math.abs(Math.sin(c)) * 0.012;
    const twist = Math.sin(c) * 0.035;

    ch.spine.rotation.set(0.035, twist, 0);
    ch.hip.position.y = 1.0 + bounce;
    applyLookAt();

    ch.leftUpperArm.rotation.set(-arm, 0, 0.06);
    ch.rightUpperArm.rotation.set(arm, 0, -0.06);
    ch.leftForearm.rotation.set(-Math.max(0, -arm) * 0.35, 0, 0);
    ch.rightForearm.rotation.set(-Math.max(0, arm) * 0.35, 0, 0);

    ch.leftHipJoint.rotation.set(leg, 0, 0);
    ch.rightHipJoint.rotation.set(-leg, 0, 0);
    ch.leftKnee.rotation.set(Math.max(0, -leg) * 0.55, 0, 0);
    ch.rightKnee.rotation.set(Math.max(0, leg) * 0.55, 0, 0);
  }

  function poseRun(t) {
    const c = t * CFG.runSpeed;
    const leg = Math.sin(c) * 0.52;
    const arm = Math.sin(c) * 0.48;
    const bounce = Math.abs(Math.sin(c)) * 0.035;
    const twist = Math.sin(c) * 0.06;
    const lean = 0.11;

    ch.spine.rotation.set(lean, twist, 0);
    ch.hip.position.y = 1.0 + bounce;
    applyLookAt();

    ch.leftUpperArm.rotation.set(-arm, 0, 0.1);
    ch.rightUpperArm.rotation.set(arm, 0, -0.1);
    ch.leftForearm.rotation.set(-0.55 - Math.max(0, -arm) * 0.3, 0, 0);
    ch.rightForearm.rotation.set(-0.55 - Math.max(0, arm) * 0.3, 0, 0);

    ch.leftHipJoint.rotation.set(leg, 0, 0);
    ch.rightHipJoint.rotation.set(-leg, 0, 0);
    ch.leftKnee.rotation.set(Math.max(0, -leg) * 1.15 + 0.08, 0, 0);
    ch.rightKnee.rotation.set(Math.max(0, leg) * 1.15 + 0.08, 0, 0);
  }

  function poseSit(t) {
    const b = Math.sin(t * 0.8) * 0.008;

    ch.spine.rotation.set(-0.08 + b, 0, 0);
    ch.hip.position.y = 0.72;
    applyLookAt();

    ch.leftUpperArm.rotation.set(0.38, 0, 0.12);
    ch.rightUpperArm.rotation.set(0.38, 0, -0.12);
    ch.leftForearm.rotation.set(-0.65, 0, 0);
    ch.rightForearm.rotation.set(-0.65, 0, 0);

    ch.leftHipJoint.rotation.set(-1.15, 0, 0);
    ch.rightHipJoint.rotation.set(-1.15, 0, 0);
    ch.leftKnee.rotation.set(1.25, 0, 0);
    ch.rightKnee.rotation.set(1.25, 0, 0);
    ch.leftUpperLeg.rotation.set(0, 0, 0.04);
    ch.rightUpperLeg.rotation.set(0, 0, -0.04);
  }

  // NEW: Interactive hover wave animation pose
  function poseWave(t) {
    const sway = Math.sin(t * 2.0) * 0.015;
    const waveCycle = Math.sin(t * 9.0) * 0.32; // rapid waving motion

    ch.spine.rotation.set(0.04, sway, 0.02);
    ch.hip.position.y = 1.0;
    applyLookAt();

    // Left hand rests casually on hip
    ch.leftUpperArm.rotation.set(0.25, 0, 0.42);
    ch.leftForearm.rotation.set(-0.55, 0, 0);

    // Right arm raised in greeting
    ch.rightUpperArm.rotation.set(-1.5, 0.1, 0.22);
    // Forearm waves back and forth
    ch.rightForearm.rotation.set(0, 0, -0.55 + waveCycle);
    
    // Reset legs to idle stance
    ch.leftHipJoint.rotation.set(0, 0, 0);
    ch.rightHipJoint.rotation.set(0, 0, 0);
    ch.leftKnee.rotation.set(0, 0, 0);
    ch.rightKnee.rotation.set(0, 0, 0);
  }

  // ── Pose Capture / Blend ──
  const BONES = [
    'spine', 'headGroup',
    'leftUpperArm', 'rightUpperArm', 'leftForearm', 'rightForearm',
    'leftHipJoint', 'rightHipJoint', 'leftUpperLeg', 'rightUpperLeg',
    'leftKnee', 'rightKnee',
  ];

  function capturePose() {
    const pose = {};
    BONES.forEach(n => {
      const b = ch[n];
      pose[n] = { rx: b.rotation.x, ry: b.rotation.y, rz: b.rotation.z };
    });
    pose.hipY = ch.hip.position.y;
    return pose;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function blendToPose(saved, f) {
    if (!saved) return;
    BONES.forEach(n => {
      const b = ch[n], s = saved[n];
      if (!s) return;
      b.rotation.x = lerp(s.rx, b.rotation.x, f);
      b.rotation.y = lerp(s.ry, b.rotation.y, f);
      b.rotation.z = lerp(s.rz, b.rotation.z, f);
    });
    ch.hip.position.y = lerp(saved.hipY, ch.hip.position.y, f);
  }

  function applyPose(state, t) {
    switch (state) {
      case 'walk': poseWalk(t); break;
      case 'run': poseRun(t); break;
      case 'sit': poseSit(t); break;
      case 'wave': poseWave(t); break;
      default: poseIdle(t);
    }
  }

  // ── Input & State Loop ──
  function updateState() {
    const now = performance.now();
    const curY = window.scrollY;
    const dY = Math.abs(curY - lastScrollY);
    const dT = Math.max(now - lastScrollTime, 16);
    scrollVelocity = (dY / dT) * 1000;

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const fraction = maxScroll > 0 ? curY / maxScroll : 0;

    let newState = 'idle';

    if (isHovered) {
      // Hover override triggers greeting wave
      newState = 'wave';
    } else if (fraction > CFG.sitThreshold && dY < 2) {
      newState = 'sit';
    } else if (dY < CFG.walkThreshold) {
      idleTimer += dT;
      newState = idleTimer > 400 ? 'idle' : animState;
    } else {
      idleTimer = 0;
      newState = scrollVelocity >= CFG.runThreshold ? 'run' : 'walk';
    }

    if (newState !== animState) {
      prevPose = capturePose();
      blendFactor = 0;
      animState = newState;
    }

    // Scroll mapping path displacement
    const el = document.getElementById('scroll-character');
    if (el && typeof gsap !== 'undefined') {
      if (window.innerWidth < 768) {
        // Dock statically at bottom-right on mobile viewports (layout handled via CSS bottom/right)
        gsap.to(el, {
          x: 0, y: 0,
          rotation: 0,
          duration: 0.3, ease: 'power3.out', overwrite: 'auto',
        });
      } else {
        // Desktop scroll animation path
        const bX = Math.max(window.innerWidth - CFG.canvasWidth - 36, 0);
        const bY = Math.max(window.innerHeight - CFG.canvasHeight - 36, 0);
        const tX = 20 + bX * fraction + Math.sin(fraction * Math.PI * 2) * 16;
        const tY = 20 + bY * (0.25 + fraction * 0.45) + Math.cos(fraction * Math.PI * 3) * 12;
        gsap.to(el, {
          x: tX - 20, y: tY - 20,
          rotation: animState === 'run' ? (fraction - 0.5) * 10 : (fraction - 0.5) * 4,
          duration: 0.22, ease: 'power3.out', overwrite: 'auto',
        });
      }
    }

    // Face rotation
    if (dY > 1 && !isHovered) {
      const dir = curY > lastScrollY ? 1 : -1;
      rootGroup.rotation.y += (dir * 0.25 - rootGroup.rotation.y) * 0.1;
    } else if (isHovered) {
      // Return to face center when waving/hovered
      rootGroup.rotation.y += (0.0 - rootGroup.rotation.y) * 0.1;
    }

    lastScrollY = curY;
    lastScrollTime = now;
  }

  // ── Listeners ──
  function initListeners() {
    const c = document.getElementById('scroll-character');
    const p = document.getElementById('runner-popup');
    if (!c || !p) return;

    // Hover triggers state override
    c.addEventListener('mouseenter', () => {
      isHovered = true;
    });

    c.addEventListener('mouseleave', () => {
      isHovered = false;
    });

    c.addEventListener('click', e => {
      e.stopPropagation();
      const open = p.classList.toggle('is-open');
      c.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    c.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const open = p.classList.toggle('is-open');
        c.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
    });

    document.addEventListener('click', e => {
      if (!c.contains(e.target)) {
        p.classList.remove('is-open');
        c.setAttribute('aria-expanded', 'false');
      }
    });

    // Global mouse tracking (normalised coordinates)
    document.addEventListener('mousemove', e => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = (e.clientY / window.innerHeight) * 2 - 1;
    });
  }

  // ── Init Scene ──
  function init() {
    const container = document.getElementById('scroll-character');
    if (!container) return;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(CFG.cameraFov, CFG.canvasWidth / CFG.canvasHeight, 0.1, 100);
    camera.position.set(0, CFG.cameraY, CFG.cameraDist);
    camera.lookAt(0, 0.55, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(3, 5, 4);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x9d4edd, 0.65);
    fill.position.set(-3, 2, -2);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0x00f2fe, 1.15);
    rim.position.set(0, 3, -4);
    scene.add(rim);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(0.38, 24),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.35;
    scene.add(ground);

    buildCharacter();

    const canvas = document.getElementById('character-canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(CFG.canvasWidth, CFG.canvasHeight);
    renderer.setClearColor(0x000000, 0);

    clock = new THREE.Clock();
    initListeners();
    window.addEventListener('scroll', updateState, { passive: true });
    animate();
  }

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    animTime += delta;

    // Smooth cursor look interpolation
    mouse.x += (mouse.targetX - mouse.x) * 0.08;
    mouse.y += (mouse.targetY - mouse.y) * 0.08;

    updateState();
    applyPose(animState, animTime);

    if (blendFactor < 1) {
      blendFactor = Math.min(blendFactor + delta / CFG.fadeDuration, 1);
      blendToPose(prevPose, blendFactor);
    }
    
    renderer.render(scene, camera);
  }

  function boot() {
    init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
